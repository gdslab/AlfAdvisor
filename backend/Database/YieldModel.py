# YieldModel.py
from __future__ import annotations

import os
import re
import io
import json
import glob
import math
import shutil
import logging
import datetime
import subprocess
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import requests
from fastapi import APIRouter, Request
from pydantic import BaseModel
from osgeo import gdal
import rasterio
from rasterio.enums import Resampling
from rasterio.mask import mask
from rasterio.warp import reproject
from shapely.geometry import Polygon
import pyproj
import geopandas as gpd
import joblib
import ee
import geemap


# Router / API models
router = APIRouter(prefix="/alfalfa/yieldModel", tags=["yieldModel"])

class ModelResult(BaseModel):
    source: str
    image_path: List[str]
    data: Dict[str, Any]


# -----------------------------# Config / constants----------------------------
logging.basicConfig(level=logging.INFO)

GAP_RANGE_DEFAULT = 7
OUT_NODATA = -9999.0
PRED_TARGETS = ("Yield", "CP", "ADF", "NDF", "NDFD")

S1_MODEL_PATHS = {
    "Yield": "./Database/YieldQuality/S1_Yield_model.joblib",
    "CP":    "./Database/YieldQuality/S1_CP_model.joblib",
    "ADF":   "./Database/YieldQuality/S1_ADF_model.joblib",
    "NDF":   "./Database/YieldQuality/S1_NDF_model.joblib",
    "NDFD":  "./Database/YieldQuality/S1_NDFD_model.joblib",
}

S2_MODEL_PATHS = {
    "Yield": "./Database/YieldQuality/S2_Yield_model.joblib",
    "CP":    "./Database/YieldQuality/S2_CP_model.joblib",
    "ADF":   "./Database/YieldQuality/S2_ADF_model.joblib",
    "NDF":   "./Database/YieldQuality/S2_NDF_model.joblib",
    "NDFD":  "./Database/YieldQuality/S2_NDFD_model.joblib",
}

TA_MODEL_PATHS = {
    "Yield": "./Database/YieldQuality/Ta_Yield_model.joblib",
    "CP":    "./Database/YieldQuality/Ta_CP_model.joblib",
    "ADF":   "./Database/YieldQuality/Ta_ADF_model.joblib",
    "NDF":   "./Database/YieldQuality/Ta_NDF_model.joblib",
    "NDFD":  "./Database/YieldQuality/Ta_NDFD_model.joblib",
}

# ---------------------- Helper function----------------------------------
def normalize_boundary_lonlat(boundary: List[List[float]]) -> List[List[float]]:
    if not boundary:
        return boundary

    a0, b0 = boundary[0][0], boundary[0][1]
    first_looks_like_lat = abs(a0) <= 90 and abs(b0) <= 180
    second_looks_like_lat = abs(b0) <= 90 and abs(a0) <= 180

    if first_looks_like_lat and not second_looks_like_lat:
        return [[lon, lat] for lat, lon in boundary]

    if all(abs(xy[0]) <= 90 for xy in boundary) and all(abs(xy[1]) <= 180 for xy in boundary):
        return [[lon, lat] for lat, lon in boundary]

    return boundary

# ------------------Earth Engine init----------------------------
@lru_cache(maxsize=1)
def init_ee() -> None:
    service_account = os.environ.get("EE_SERVICE_ACCOUNT")
    credentials = ee.ServiceAccountCredentials(service_account, os.environ.get("EE_CREDENTIALS"))
    ee.Initialize(credentials)

def ee_polygon_from_lonlat(boundary_lonlat: List[List[float]]) -> ee.Geometry:
    return ee.Geometry.Polygon(boundary_lonlat)

# --------------------Joblib model caching---------------------------------
@lru_cache(maxsize=None)
def _load_joblib(path: str):
    return joblib.load(path)

def predict_targets(X: np.ndarray, model_paths: Dict[str, str]) -> pd.DataFrame:
    out = {}
    for name, p in model_paths.items():
        out[name] = _load_joblib(p).predict(X)
    return pd.DataFrame(out)

# ---------------GDAL raster helpers (shared by S1 & S2)-------------------
@dataclass(frozen=True)
class GdalTemplate:
    width: int
    height: int
    geotransform: Tuple[float, ...]
    projection: str
    src_nodata: Optional[float]


def gdal_template(path: str, band: int = 1) -> GdalTemplate:
    ds = gdal.Open(path, gdal.GA_ReadOnly)
    if ds is None:
        raise FileNotFoundError(f"Cannot open raster: {path}")

    b = ds.GetRasterBand(band)
    nod = b.GetNoDataValue()

    tmpl = GdalTemplate(
        width=ds.RasterXSize,
        height=ds.RasterYSize,
        geotransform=ds.GetGeoTransform(),
        projection=ds.GetProjection(),
        src_nodata=nod,
    )
    ds = None
    return tmpl


def gdal_read_flat(path: str, band: int = 1) -> np.ndarray:
    ds = gdal.Open(path, gdal.GA_ReadOnly)
    if ds is None:
        raise FileNotFoundError(f"Cannot open raster: {path}")
    arr = ds.GetRasterBand(band).ReadAsArray()
    ds = None
    return np.asarray(arr).reshape(-1)


def _valid_mask(template_flat: np.ndarray, src_nodata: Optional[float]) -> np.ndarray:
    m = ~np.isnan(template_flat)
    if src_nodata is not None:
        m &= (template_flat != src_nodata)
    return m


def write_single_band_tiff(
    tmpl: GdalTemplate,
    out_path: str,
    values_flat: np.ndarray,
    *,
    valid_mask_flat: Optional[np.ndarray] = None,
    out_nodata: float = OUT_NODATA,
) -> None:
    driver = gdal.GetDriverByName("GTiff")
    ds = driver.Create(
        out_path,
        tmpl.width,
        tmpl.height,
        1,
        gdal.GDT_Float32,
        options=["TILED=YES", "COMPRESS=LZW"],
    )
    ds.SetGeoTransform(tmpl.geotransform)
    ds.SetProjection(tmpl.projection)

    band = ds.GetRasterBand(1)
    band.SetNoDataValue(out_nodata)

    data = np.asarray(values_flat, dtype=np.float32).copy()
    if valid_mask_flat is not None:
        data[~valid_mask_flat] = out_nodata

    band.WriteArray(data.reshape(tmpl.height, tmpl.width))
    band.FlushCache()
    ds = None


def write_df_columns_as_tiffs(
    tmpl: GdalTemplate,
    template_flat: np.ndarray,
    result_df: pd.DataFrame,
    out_dir: str,
    *,
    prefix: str,
    gap: int,
) -> List[str]:
    out_dir_p = Path(out_dir)
    out_dir_p.mkdir(parents=True, exist_ok=True)

    mask_valid = _valid_mask(template_flat, tmpl.src_nodata)

    paths: List[str] = []
    for col in result_df.columns:
        out_path = str(out_dir_p / f"{prefix}_{col}_gap{gap}.tif")
        write_single_band_tiff(
            tmpl,
            out_path,
            result_df[col].to_numpy(),
            valid_mask_flat=mask_valid,
        )
        paths.append(out_path)
    return paths

# --------------Sentinel-1: download + model-----------------------------
def download_S1(image_path: str, boundary_lonlat: List[List[float]], date: datetime.date, six_day_before: datetime.date) -> bool:
    init_ee()
    field = ee_polygon_from_lonlat(boundary_lonlat)

    sentinel1data = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(field)
        .filterDate(str(six_day_before), str(date))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VH"))
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .sort("system:time_start", False)  # newest first
    )

    if sentinel1data.size().getInfo() == 0:
        return False

    first_image = sentinel1data.first()
    clipped = first_image.clip(field).unmask()

    image_path = str(image_path)
    os.makedirs(image_path, exist_ok=True)
    image_name = os.path.join(image_path, f"S1_{date}.tif")

    geemap.ee_export_image(clipped, filename=image_name, region=field, scale=30, crs="EPSG:4326")
    return True


def _s1_features(vv: np.ndarray, vh: np.ndarray, angle: np.ndarray) -> np.ndarray:
    vh_minus_vv = np.subtract(vh, vv, out=np.full_like(vh, np.nan, dtype=np.float32), where=np.isfinite(vh) & np.isfinite(vv))
    denom = vv + vh
    rvi = np.divide(4 * vh, denom, out=np.full_like(vh, np.nan, dtype=np.float32), where=(denom != 0))
    return np.column_stack([vv, vh, vh_minus_vv, rvi, angle]).astype(np.float32, copy=False)

def Model_S1(base_dir: str, output_dir: str, gap_range: int = GAP_RANGE_DEFAULT) -> Dict[str, Any]:
    all_image_list: List[str] = []
    final_data: Dict[int, Dict[str, Any]] = {}

    tif_files = sorted(Path(base_dir).glob("*.tif"))
    for tif in tif_files:
        tif = str(tif)
        tmpl = gdal_template(tif, band=1)

        vv = gdal_read_flat(tif, band=1).astype(np.float32, copy=False)
        vh = gdal_read_flat(tif, band=2).astype(np.float32, copy=False)
        ang = gdal_read_flat(tif, band=3).astype(np.float32, copy=False)

        baseX = _s1_features(vv, vh, ang)

        for gap in range(gap_range):
            gap_col = np.full((baseX.shape[0], 1), gap, dtype=np.float32)
            X = np.hstack([gap_col, baseX])  # (n, 1 + 5)

            preds = predict_targets(X, S1_MODEL_PATHS)
            paths = write_df_columns_as_tiffs(tmpl, vv, preds, output_dir, prefix="S1", gap=gap)

            all_image_list.extend(paths)
            final_data[gap] = preds.to_dict(orient="list")

    return {"source": "s1", "image_path": all_image_list, "data": final_data}

# ------------- HLS (S2): download + model----------------------------
def download_S2(userID: str, TileID: List[str], farmID: str, fieldID: str, today: datetime.date, six_days_ago: datetime.date) -> None:
    logging.info(f"TileID: {TileID}")
    os.makedirs("./HLS", exist_ok=True)

    today_s = today.strftime("%Y-%m-%d")
    six_s = six_days_ago.strftime("%Y-%m-%d")

    tmp_tile = "./HLS/tmp.tileid.txt"
    with open(tmp_tile, "w") as f:
        for t in TileID:
            f.write(f"{t}\n")

    script_path = "./HLS/getHLS.sh"
    out_dir = f"./HLS/{userID}/{farmID}/{fieldID}/RawImage/"
    args = [tmp_tile, six_s, today_s, out_dir]

    try:
        subprocess.run([script_path] + args, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to download HLS. Error: {e.stderr}")
        raise


def clip_raster_with_coordinates(input_raster: str, output_raster: str, boundary_lonlat: List[List[float]]) -> Optional[str]:
    with rasterio.open(input_raster) as src:
        target_crs = src.crs
        if target_crs is None:
            return None

        source_crs = pyproj.CRS("EPSG:4326")
        transformer = pyproj.Transformer.from_crs(source_crs, target_crs, always_xy=True)

        transformed = [transformer.transform(lon, lat) for lon, lat in boundary_lonlat]
        polygon = Polygon(transformed)

        rb = src.bounds
        pb = polygon.bounds
        if pb[0] > rb.right or pb[2] < rb.left or pb[1] > rb.top or pb[3] < rb.bottom:
            return None

        gdf = gpd.GeoDataFrame({"geometry": [polygon]}, crs=target_crs)
        buffered = gdf.buffer(0)

        clipped_data, clipped_transform = mask(src, [buffered.geometry.values[0]], crop=True)

        clipped_meta = src.meta.copy()
        clipped_meta.update(
            {"height": clipped_data.shape[1], "width": clipped_data.shape[2], "transform": clipped_transform}
        )

        tmp = "./temporary_clip.tif"
        with rasterio.open(tmp, "w", **clipped_meta) as dst:
            dst.write(clipped_data)

    # warp to EPSG:4326 for your frontend pipeline
    gdal.Warp(output_raster, tmp, dstSRS="EPSG:4326")

    if os.path.exists(tmp):
        os.remove(tmp)

    return output_raster


def processing_S2(path: str, boundary_lonlat: List[List[float]]) -> bool:
    input_folder = os.path.join(path, "RawImage")
    clipped_folder = os.path.join(path, "Clip")
    os.makedirs(clipped_folder, exist_ok=True)

    has_valid = False

    for input_tiff in glob.glob(os.path.join(input_folder, "HLS.S30*", "*.tif")):
        subdir = os.path.basename(os.path.dirname(input_tiff))
        base = os.path.basename(input_tiff)

        output_clip_path = os.path.join(clipped_folder, subdir, base)
        os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)

        result = clip_raster_with_coordinates(input_tiff, output_clip_path, boundary_lonlat)
        if not result:
            continue

        with rasterio.open(output_clip_path) as ds:
            band = ds.read(1)
            nod = ds.nodata

        if nod is not None:
            is_empty = np.all((band == nod) | (band == 0) | np.isnan(band))
        else:
            is_empty = np.all((band == 0) | np.isnan(band))

        if is_empty:
            shutil.rmtree(os.path.dirname(output_clip_path), ignore_errors=True)
        else:
            has_valid = True

    return has_valid


def find_most_recent_folder(base_dir: str) -> Optional[str]:
    input_dir = os.path.join(base_dir, "Clip")
    if not os.path.isdir(input_dir):
        return None

    folders = [f for f in os.listdir(input_dir) if os.path.isdir(os.path.join(input_dir, f))]
    if not folders:
        return None

    most_recent_folder = None
    most_recent_date = -1

    for folder in folders:
        parts = folder.split(".")
        if len(parts) < 4:
            continue
        jul = parts[3][:7]
        if not jul.isdigit():
            continue
        jd = int(jul)
        if jd > most_recent_date:
            most_recent_date = jd
            most_recent_folder = folder

    return os.path.join(input_dir, most_recent_folder) if most_recent_folder else None


# HLS band name parsing: robust regex
BAND_RE = re.compile(r"(B0[4-7]|B8A|B12|SAA|SZA|VAA|VZA)", re.IGNORECASE)

def _read_hls_stack_flat(directory: str) -> Dict[str, np.ndarray]:
    out: Dict[str, np.ndarray] = {}
    for p in sorted(Path(directory).glob("*.tif")):
        m = BAND_RE.search(p.name)
        if not m:
            continue
        key = m.group(1).upper()
        out[key] = gdal_read_flat(str(p), band=1).astype(np.float32, copy=False)
    return out


def _s2_base_features(stack: Dict[str, np.ndarray]) -> Tuple[np.ndarray, np.ndarray]:
    required = ["B04", "B05", "B06", "B07", "B8A", "B12", "SAA", "SZA", "VAA", "VZA"]
    missing = [k for k in required if k not in stack]
    if missing:
        raise ValueError(f"Missing required HLS bands/angles: {missing}")

    B4, B5, B6, B7 = stack["B04"], stack["B05"], stack["B06"], stack["B07"]
    B8, B12 = stack["B8A"], stack["B12"]
    SAA, SZA, VAA, VZA = stack["SAA"], stack["SZA"], stack["VAA"], stack["VZA"]

    ndvi = np.divide(B8 - B4, B8 + B4, out=np.full_like(B8, np.nan), where=((B8 + B4) != 0))
    evi2 = np.divide(
        2.5 * (B8 - B4),
        (B8 + 2.4 * B4 + 1),
        out=np.full_like(B8, np.nan),
        where=((B8 + 2.4 * B4 + 1) != 0),
    )
    nirv = ndvi * B8
    ndwi = np.divide(B8 - B12, B8 + B12, out=np.full_like(B8, np.nan), where=((B8 + B12) != 0))

    baseX = np.column_stack([ndvi, evi2, nirv, ndwi, B5, B6, B7, SZA, SAA, VZA, VAA]).astype(np.float32, copy=False)
    template_flat = B8.astype(np.float32, copy=False)
    return template_flat, baseX


def Model_S2(input_dir: str, output_dir: str, gap_range: int = GAP_RANGE_DEFAULT) -> Dict[str, Any]:
    stack = _read_hls_stack_flat(input_dir)

    # Use B8A as template
    b8a_files = sorted(glob.glob(str(Path(input_dir) / "*B8A*.tif")))
    if not b8a_files:
        raise FileNotFoundError("No B8A tif found in HLS clip folder to use as template.")
    template_path = b8a_files[0]

    tmpl = gdal_template(template_path, band=1)
    template_flat, baseX = _s2_base_features(stack)

    all_image_list: List[str] = []
    final_data: Dict[int, Dict[str, Any]] = {}

    for gap in range(gap_range):
        gap_col = np.full((baseX.shape[0], 1), gap, dtype=np.float32)
        X = np.hstack([gap_col, baseX])

        preds = predict_targets(X, S2_MODEL_PATHS)
        paths = write_df_columns_as_tiffs(tmpl, template_flat, preds, output_dir, prefix="S2", gap=gap)

        all_image_list.extend(paths)
        final_data[gap] = preds.to_dict(orient="list")

    return {"source": "hls", "image_path": all_image_list, "data": final_data}


# -----------------------Ensemble averaging (S1 + S2)-----------------------
def average_rasters(result_S1: str, result_S2: str, output_raster_path: str) -> Tuple[str, List[float]]:
    with rasterio.open(result_S1) as src:
        src_data = src.read(1).astype(np.float32, copy=False)
        src_transform = src.transform
        src_crs = src.crs
        src_h, src_w = src.height, src.width

        with rasterio.open(result_S2) as tgt:
            tgt_data = tgt.read(1).astype(np.float32, copy=False)
            tgt_transform = tgt.transform
            tgt_crs = tgt.crs

            need_reproject = (tgt_crs != src_crs) or (tgt_transform != src_transform) or (tgt_data.shape != src_data.shape)
            if need_reproject:
                dst = np.full((src_h, src_w), np.nan, dtype=np.float32)
                reproject(
                    source=tgt_data,
                    destination=dst,
                    src_transform=tgt_transform,
                    src_crs=tgt_crs,
                    dst_transform=src_transform,
                    dst_crs=src_crs,
                    resampling=Resampling.nearest,
                )
                tgt_data = dst
            else:
                if tgt_data.shape != src_data.shape:
                    tgt_data = tgt.read(1, out_shape=(src_h, src_w), resampling=Resampling.nearest)

    avg = np.where(
        np.isnan(src_data),
        tgt_data,
        np.where(np.isnan(tgt_data), src_data, (src_data + tgt_data) / 2.0),
    )

    with rasterio.open(
        output_raster_path,
        "w",
        driver="GTiff",
        height=avg.shape[0],
        width=avg.shape[1],
        count=1,
        dtype="float32",
        crs=src_crs,
        transform=src_transform,
        nodata=OUT_NODATA,
        compress="lzw",
        tiled=True,
    ) as out_ds:
        out_ds.write(avg, 1)

    return output_raster_path, avg.reshape(-1).tolist()


def calculate_average(result_s1_paths: List[str], result_s2_paths: List[str], output_directory: str) -> Dict[str, Any]:
    def index_paths(paths: List[str]) -> Dict[str, str]:
        return {Path(p).stem: p for p in paths}

    s1 = index_paths(result_s1_paths)
    s2 = index_paths(result_s2_paths)

    final_data: Dict[int, Dict[str, Optional[List[float]]]] = {}
    all_image_list: List[str] = []

    for gap in range(GAP_RANGE_DEFAULT):
        gap_data: Dict[str, Optional[List[float]]] = {}
        for k in PRED_TARGETS:
            key1 = f"S1_{k}_gap{gap}"
            key2 = f"S2_{k}_gap{gap}"
            p1, p2 = s1.get(key1), s2.get(key2)

            if not p1 or not p2:
                gap_data[k] = None
                continue

            out_path = str(Path(output_directory) / f"averaged_{k}_gap{gap}.tif")
            _, avg_flat = average_rasters(p1, p2, out_path)
            gap_data[k] = avg_flat
            all_image_list.append(out_path)

        final_data[gap] = gap_data

    return {"source": "ensemble", "image_path": all_image_list, "data": final_data}


# ----------------Weather model (Open-Meteo + constant rasters)--------------------
def fetch_data(boundary_lonlat: List[List[float]], date_: datetime.date) -> Tuple[Optional[float], Optional[float]]:
    base_url = "https://api.open-meteo.com/v1/forecast"
    lon, lat = boundary_lonlat[0][0], boundary_lonlat[0][1]

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": str(date_),
        "end_date": str(date_),
        "daily": "temperature_2m_max,temperature_2m_min",
        "timezone": "auto",
    }

    r = requests.get(base_url, params=params, timeout=30)
    if r.status_code != 200:
        logging.warning(f"Open-Meteo failed for {date_}: {r.status_code}")
        return None, None

    data = r.json()
    daily = data.get("daily", {})
    tmax = daily.get("temperature_2m_max", [None])[0]
    tmin = daily.get("temperature_2m_min", [None])[0]
    return tmin, tmax


def predict_Ta(gap: int, tmin: float, tmax: float) -> Dict[str, float]:
    X = np.array([[gap, tmin, tmax]], dtype=np.float32)
    df = predict_targets(X, TA_MODEL_PATHS)  
    row = df.iloc[0].to_dict()
    return {k: float(row[k]) for k in PRED_TARGETS}


def download_constant_rasters_from_S1(
    output_dir: str,
    boundary_lonlat: List[List[float]],
    date: datetime.date,
    two_months_ago: datetime.date,
    predictions: Dict[str, float],
    gap: int,
) -> Tuple[List[str], Dict[str, List[float]]]:
    """
    Creates constant-value rasters for each prediction (no need to "modify" VV pixels).
    Keeps band name "VV" for compatibility with your current reducer code.
    """
    init_ee()
    field = ee_polygon_from_lonlat(boundary_lonlat)

    s1 = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(field)
        .filterDate(str(two_months_ago), str(date))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .sort("system:time_start", False)
    )

    if s1.size().getInfo() == 0:
        return [], {}

    image_list: List[str] = []
    pixel_data: Dict[str, List[float]] = {}

    os.makedirs(output_dir, exist_ok=True)

    for key, value in predictions.items():
        out_file = os.path.join(output_dir, f"Ta_{key}_gap{gap}.tif")
        image_list.append(out_file)

        img = ee.Image.constant(value).rename("VV").clip(field)
        geemap.ee_export_image(img, filename=out_file, scale=30, region=field, crs="EPSG:4326")

        vals = (
            img.reduceRegion(
                reducer=ee.Reducer.toList(),
                geometry=field,
                scale=30,
                maxPixels=1e9,
            )
            .getInfo()
            .get("VV", [])
        )
        pixel_data[key] = vals

    return image_list, pixel_data


def weather_model(boundary_lonlat: List[List[float]], today_dt: datetime.datetime, output_path: str) -> Dict[str, Any]:
    all_image_list: List[str] = []
    final_data: Dict[str, Any] = {}

    today_date = today_dt.date()

    for gap in range(GAP_RANGE_DEFAULT):
        target_date = today_date + datetime.timedelta(days=gap)
        two_months_ago = target_date - datetime.timedelta(days=60)

        tmin, tmax = fetch_data(boundary_lonlat, target_date)
        if tmin is None or tmax is None:
            continue

        preds = predict_Ta(gap, float(tmin), float(tmax))
        imgs, pix = download_constant_rasters_from_S1(
            output_path, boundary_lonlat, target_date, two_months_ago, preds, gap
        )

        all_image_list.extend(imgs)
        final_data[f"gap_{gap}"] = pix

    return {"source": "weather", "image_path": all_image_list, "data": final_data}


# ------------------ Main ---------------------------
@router.post("/model/")
async def run_model(request: Request):
    data = await request.json()

    TileID = data["tile_id"]
    UserID = data["user_id"]
    FarmID = data["farm_id"]
    FieldID = data["field_id"]
    boundary_raw = json.loads(data["boundary"])
    boundary_lonlat = normalize_boundary_lonlat(boundary_raw)

    today = datetime.datetime.today()
    six_days_before = today.date() - datetime.timedelta(days=6)

    base_path_S1 = f"./Sentinel_1/{UserID}/{FarmID}/{FieldID}"
    base_path_S2 = f"./HLS/{UserID}/{FarmID}/{FieldID}"
    output_path = f"Static/{UserID}/{FarmID}/{FieldID}/"

    os.makedirs(base_path_S1, exist_ok=True)
    os.makedirs(base_path_S2, exist_ok=True)
    os.makedirs(output_path, exist_ok=True)

    result_S1 = None
    result_S2 = None

    try:
        if download_S1(base_path_S1, boundary_lonlat, today.date(), six_days_before):
            result_S1 = Model_S1(base_path_S1, output_path, gap_range=GAP_RANGE_DEFAULT)
    except Exception as e:
        logging.exception(f"Failed to process S1: {e}")

    try:
        download_S2(UserID, TileID, FarmID, FieldID, today.date(), six_days_before)
        if processing_S2(base_path_S2, boundary_lonlat):
            folder_path = find_most_recent_folder(base_path_S2)
            if folder_path:
                result_S2 = Model_S2(folder_path, output_path, gap_range=GAP_RANGE_DEFAULT)
    except Exception as e:
        logging.exception(f"Failed to process S2: {e}")

    if not result_S1 and not result_S2:
        return weather_model(boundary_lonlat, today, output_path)

    if result_S1 and result_S2:
        return calculate_average(result_S1["image_path"], result_S2["image_path"], output_path)

    return result_S1 if result_S1 else result_S2
