
from fastapi import FastAPI, APIRouter, Request, Depends, HTTPException, Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTasks
from dotenv import load_dotenv
load_dotenv()
from fastapi.encoders import jsonable_encoder
from typing import List
from pydantic import BaseModel
from osgeo import gdal
import geopandas
import zipfile
import geojson, shutil, glob, json, os, getpass, re
# from asf_search.exceptions import ASFSearchError
from os import listdir, getenv
from datetime import date
import rioxarray, rasterio
from shapely.geometry import mapping
from fastapi.middleware.cors import CORSMiddleware
from Database import dataMain
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from Database.database import engine, SessionLocal
from Database import models
import math
import requests
import datetime
from Database import models
from .database import engine, SessionLocal
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import  Optional
from typing_extensions import Annotated
import geojson,glob, json
from .dataMain import get_current_user
from starlette import status
import ee
import geemap
import subprocess
import rasterio
from rasterio.mask import mask
from shapely.geometry import Polygon
from shapely.geometry import box
import geopandas as gpd
import pyproj
import shutil
from rasterio.errors import RasterioIOError
import io
from rasterio.warp import calculate_default_transform, reproject
from rasterio.crs import CRS
import logging
import os
import numpy as np
import pandas as pd
import csv
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
import joblib
import glob
from rasterio.enums import Resampling

router = APIRouter(
    prefix='/alfalfa/yieldModel',
    tags=['yieldModel']
)

########################### Y/Q model based on Sentinel-1 data #############################################
import ee

# service_account = os.environ.get("EE_SERVICE_ACCOUNT")
# credentials = ee.ServiceAccountCredentials(service_account, os.environ.get("EE_CREDENTIALS"))
# ee.Initialize(credentials)

def download_S1 (image_path, field_boundary, date, six_day_before):
    # GEE authentication
    service_account = 'your/account/service'
    key_file_path = 'the/path/to/your/json/file'
    credentials = ee.ServiceAccountCredentials(service_account, key_file_path)
    ee.Initialize(credentials)
    print("GEE has been initialized successfully with the service account!")
    
    # download Sentinel1 data
    coordinates = [[lon, lat] for lat, lon in field_boundary]
    field = ee.Geometry.Polygon(coordinates)
    
    sentinel1data = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(field)
        .filterDate( f'{six_day_before}', f'{date}') 
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .sort('system:time_start', True)
        )
    
    # Check if any images exist in the specified time range
    if sentinel1data.size().getInfo() == 0:
        print("No images found in the specified time range.")
        return False
    
    first_image = sentinel1data.first()
    clipped_image = first_image.clip(field).unmask()
    image_name= os.path.join(image_path,f'S1_{date}_.tif')
    geemap.ee_export_image(clipped_image, filename= image_name, region = field, scale=30, crs='EPSG:4326')
    return True


def Model_S1 (base_dir, output_dir, gap_range=7):
    all_image_list = []
    final_data = {}
        
    def read_tiff_files(file_path):
        dataset = gdal.Open(file_path, gdal.GA_ReadOnly)
        
        vv_band = dataset.GetRasterBand(1)  
        vh_band = dataset.GetRasterBand(2)  
        angle_band = dataset.GetRasterBand(3)
        
        vv = vv_band.ReadAsArray().flatten()
        vh = vh_band.ReadAsArray().flatten()
        angle = angle_band.ReadAsArray().flatten()
        
        return pd.DataFrame({'vv': vv, 'vh': vh, 'angle': angle})
    
    def calculate_Indices(vv, vh, angle, gap):
        RVI = (4 * vh) / (vv + vh)
        return pd.DataFrame ({
            'gap' : gap,
            'vv': vv,
            'vh': vh,
            'vv/vh': vv/vh,
            'RVI': RVI,
            'incident_angle': angle,
        })
    
    def process_tiff_files(tif, gap):
        df = read_tiff_files(tif)
        df_indices = calculate_Indices (vv = df['vv'], vh = df['vh'], angle = df['angle'], gap=gap)
        return df['vv'], df_indices.to_numpy()
    
    def YieldModel(S1_input):
        S1_Yield_model = joblib.load("./Database/YieldQuality/S1_Yield_model.joblib")
        S1_CP_model = joblib.load("./Database/YieldQuality/S1_CP_model.joblib")
        S1_ADF_model = joblib.load("./Database/YieldQuality/S1_ADF_model.joblib")
        S1_NDF_model = joblib.load("./Database/YieldQuality/S1_NDF_model.joblib")
        S1_NDFD_model = joblib.load("./Database/YieldQuality/S1_NDFD_model.joblib")
        
        return pd.DataFrame ({
            'Yield': S1_Yield_model.predict(S1_input),
            'CP': S1_CP_model.predict(S1_input),
            'ADF': S1_ADF_model.predict(S1_input),
            'NDF': S1_NDF_model.predict(S1_input),
            'NDFD': S1_NDFD_model.predict(S1_input),
        })
    
    def convert_column_to_tiff(original, column_data, output_path, width, height, geoTransform, projection):
        column_data_update = np.where((original == -9999) | original.isna(), np.nan, column_data)
        
        driver = gdal.GetDriverByName('GTiff')
        new_dataset = driver.Create(output_path, width, height, 1, gdal.GDT_Float32) #GDT_Float32
        new_band = new_dataset.GetRasterBand(1)
        new_band.WriteArray(np.array(column_data_update).reshape(height, width), 0, 0)
        new_dataset.SetGeoTransform(geoTransform)
        new_dataset.SetProjection(projection)
        new_band.FlushCache()
        del new_dataset
        
    def get_tiff_dimensions(file_path):
        dataset = gdal.Open(file_path)
        width = dataset.RasterXSize
        height = dataset.RasterYSize
        geoTransform = dataset.GetGeoTransform()
        projection = dataset.GetProjection()
        return width, height, geoTransform, projection
        
    def columns_to_tiff(original, result_df, input_file, output_directory, gap):
        width, height, geoTransform, projection = get_tiff_dimensions(input_file)
        image_list = []

        for column_name in result_df.columns:
            output_path = os.path.join(output_directory, f"S1_{column_name}_gap{gap}.tif")
            image_list.append(output_path)
            convert_column_to_tiff(original, result_df[column_name], output_path, width, height, geoTransform, projection)
        
        return image_list

    def delete_contents(directory_path):
        for item in os.listdir(directory_path):
            item_path = os.path.join(directory_path, item)
            if os.path.isfile(item_path):
                os.unlink(item_path)  # Delete the file
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)  # Delete the folder and its contents
    
    for gap in range(gap_range):
        for file in glob.glob(os.path.join(base_dir, '*.tif')):
            original, indices = process_tiff_files(file, gap)
            model_results = YieldModel(indices)
            path = columns_to_tiff(original, model_results, file, output_dir, gap)
            
            all_image_list.extend(path)
            final_data[gap]=model_results.to_dict(orient='list')
    
    return {
        "image_path": all_image_list,
        "data": final_data
    }

########################### Y/Q model based on HLS data #############################################
def download_S2(userID, TileID, farmID, fieldID, today, six_days_ago ):
    logging.info(f"TileID: {TileID}")
    os.makedirs("./HLS", exist_ok=True)
    
    today = today.strftime("%Y-%m-%d")
    six_days_ago = six_days_ago.strftime("%Y-%m-%d")
    
    # Write the Tile IDs to a temporary file
    with open("./HLS/tmp.tileid.txt", "w") as file:
        for tile_id in TileID:
            file.write(f"{tile_id}\n")
    
    script_path = "./HLS/getHLS.sh"
    args = ['./HLS/tmp.tileid.txt', six_days_ago, today, f"./HLS/{userID}/{farmID}/{fieldID}/RawImage/"]
    
    try:
        result = subprocess.run([script_path] + args, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to download images. Error: {e.stderr}")
        raise


def clip_raster_with_coordinates(input_raster, output_raster, coordinates):
    with rasterio.open(input_raster) as src:
        target_crs = src.crs
        source_crs = pyproj.CRS("EPSG:4326")
        temporary_file = './temporary.tif'
        
        transformer = pyproj.Transformer.from_crs(source_crs, target_crs)
        transformed_coordinates = [transformer.transform(coord[0], coord[1]) for coord in coordinates]
        polygon = Polygon(transformed_coordinates)
        
        raster_bounds = src.bounds
        polygon_bounds = polygon.bounds

        if (polygon_bounds[0] > raster_bounds[2] or polygon_bounds[2] < raster_bounds[0] or polygon_bounds[1] > raster_bounds[3] or polygon_bounds[3] < raster_bounds[1]):
            return None
        
        gdf = gpd.GeoDataFrame({'geometry': [polygon]}, crs=src.crs)
        buffered_polygon = gdf.buffer(0 * max(src.res))
        
        clipped_data, clipped_transform = mask(src, [buffered_polygon.geometry.values[0]], crop=True) #all_touched=True,
        
        clipped_meta = src.meta.copy()
        clipped_meta.update({"height": clipped_data.shape[1], "width": clipped_data.shape[2], "transform": clipped_transform})
        
        with rasterio.open(temporary_file, "w", **clipped_meta) as dst:
            dst.write(clipped_data)
        
        gdal.Warp(output_raster, temporary_file, dstSRS='EPSG:4326')
        
        # Clean up the temporary file
        if os.path.exists(temporary_file):
            os.remove(temporary_file)
    
        return output_raster


def processing_S2(path, coordinates):
    input_folder = os.path.join(path, "RawImage")
    clipped_folder = os.path.join(path, "Clip")
    os.makedirs(clipped_folder, exist_ok=True)
    
    has_valid_result = False  # Initialize a flag to track valid results
    
    for input_tiff in glob.glob(os.path.join(input_folder, "HLS.S30*", "*.tif")):
        subdirectory_name = os.path.basename(os.path.dirname(input_tiff))
        base_name = os.path.basename(input_tiff)
        
        output_clip_path = os.path.join(clipped_folder, subdirectory_name, base_name)
        os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)
        result = clip_raster_with_coordinates(input_tiff, output_clip_path, coordinates)
        
        if result:
            with rasterio.open(output_clip_path) as dataset:
                band = dataset.read(1)  # Read the first band
                no_data_value = dataset.nodata
                
                if no_data_value is not None:
                    is_empty = np.all((band == no_data_value) | (band == 0) | np.isnan(band))
                else:
                    is_empty = np.all((band == 0) | np.isnan(band))

                # If the raster is empty, delete the folder containing the output raster
                if is_empty:
                    folder_to_remove = os.path.dirname(output_clip_path)
                    shutil.rmtree(folder_to_remove)
                else:
                    has_valid_result = True
            
            dataset = None
    
    return has_valid_result

def find_most_recent_folder(base_dir):
    input_dir = os.path.join(base_dir, "Clip")
    folders = [f for f in os.listdir(input_dir) if os.path.isdir(os.path.join(input_dir, f))]

    most_recent_folder = None
    most_recent_date = 0

    for folder in folders:
        print('this is the folder name is average:',folder)
        # Extract the Julian date part from the folder name
        julian_date = folder.split('.')[3][:7]
        julian_date = int(julian_date)

        # Compare with the most recent date found
        if julian_date > most_recent_date:
            most_recent_date = julian_date
            most_recent_folder = folder
    
    most_recent_folder_path = os.path.join(input_dir, most_recent_folder)
    return most_recent_folder_path

def flatten_tiff(file_path):
    dataset = gdal.Open(file_path, gdal.GA_Update)
    band = dataset.GetRasterBand(1)
    array = band.ReadAsArray()
    flattened = array.flatten()
    return flattened
    
def read_tiff_files(directory):
    tiff_files = [file for file in os.listdir(directory) if file.endswith('.tif') or file.endswith('.tiff')]
    df = pd.DataFrame()
    
    for idx, file in enumerate(tiff_files):
        file_path = os.path.join(directory, file)
        flattened_pixels = flatten_tiff(file_path)
        prefix = file_path[-7:-4]
        df[f'{prefix}'] = flattened_pixels
    
    return df

def calculate_Indices(gap, B4, B5, B6, B7, B8, B12, SAA, SZA, VAA, VZA):
    NDVI = (B8 - B4)/(B8 + B4)
    EVI2 = 2.5 * ((B8 - B4) /(B8 + 2.4 * B4 + 1))
    NIRV = NDVI + B8
    NDWI = (B8 - B12)/(B8 + B12)

    indices_data = {
        'gap' : gap,
        'NDVI': NDVI,
        'EVI2': EVI2,
        'NIRV': NIRV,
        'NDWI': NDWI,
        'B5': B5,
        'B6': B6,
        'B7': B7,
        'SZA': SZA,
        'SAA': SAA,
        'VZA': VZA,
        'VAA': VAA,
    }
    indices_df = pd.DataFrame(indices_data)
    return indices_df

def process_tiff_files(directory_path, gap):
    df = read_tiff_files(directory_path)

    B4 = df['B04']
    B5 = df['B05']
    B6 = df['B06']
    B7 = df['B07']
    B8 = df['B8A']
    B12 = df['B12']
    SAA = df['SAA']
    SZA = df['SZA']
    VAA = df['VAA']
    VZA = df['VZA']

    result_df = calculate_Indices(gap, B4, B5, B6, B7, B8, B12, SAA, SZA, VAA, VZA)
    return B8, result_df.to_numpy()

def YieldModel(S2_input):
    S2_Yield_model = joblib.load("./Database/YieldQuality/S2_Yield_model.joblib")
    S2_CP_model = joblib.load("./Database/YieldQuality/S2_CP_model.joblib")
    S2_ADF_model = joblib.load("./Database/YieldQuality/S2_ADF_model.joblib")
    S2_NDF_model = joblib.load("./Database/YieldQuality/S2_NDF_model.joblib")
    S2_NDFD_model = joblib.load("./Database/YieldQuality/S2_NDFD_model.joblib")
    
    predictions_S2 = {
        'Yield': S2_Yield_model.predict(S2_input),
        'CP': S2_CP_model.predict(S2_input),
        'ADF': S2_ADF_model.predict(S2_input),
        'NDF': S2_NDF_model.predict(S2_input),
        'NDFD': S2_NDFD_model.predict(S2_input)
    }
    result_df = pd.DataFrame(predictions_S2)
    return result_df

def convert_column_to_tiff(original, column_data, output_path, width, height, geoTransform, projection):
    column_data_update = np.where((original == -9999) | original.isna(), np.nan, column_data)
    
    driver = gdal.GetDriverByName('GTiff')
    new_dataset = driver.Create(output_path, width, height, 1, gdal.GDT_Float32) #GDT_Float32
    new_band = new_dataset.GetRasterBand(1)
    new_band.WriteArray(np.array(column_data_update).reshape(height, width), 0, 0)
    new_dataset.SetGeoTransform(geoTransform)
    new_dataset.SetProjection(projection)
    new_band.FlushCache()
    del new_dataset
    
def get_tiff_dimensions(file_path):
    dataset = gdal.Open(file_path)
    width = dataset.RasterXSize
    height = dataset.RasterYSize
    geoTransform = dataset.GetGeoTransform()
    projection = dataset.GetProjection()
    return width, height, geoTransform, projection
    
def columns_to_tiff(original, result_df, input_directory, output_directory, gap):
    template_tiff = glob.glob(os.path.join(input_directory, "*B8A.tif"))[0]
    width, height, geoTransform, projection = get_tiff_dimensions(template_tiff)
    image_list = []
    
    for column_name in result_df.columns:
        output_path = os.path.join(output_directory, f"S2_{column_name}_gap{gap}.tif")
        image_list.append(output_path)
        convert_column_to_tiff(original, result_df[column_name], output_path, width, height, geoTransform, projection)
        
    return image_list

def delete_contents(directory_path):
    for item in os.listdir(directory_path):
        item_path = os.path.join(directory_path, item)
        if os.path.isfile(item_path):
            os.unlink(item_path)  # Delete the file
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path)  # Delete the folder and its contents


def Model_S2 (input_dir, output_dir):
    final_data = {}
    all_image_list = []
    
    for gap in range (7):
        nodata, result = process_tiff_files(input_dir, gap)
        model_results = YieldModel (result)
        image_list = columns_to_tiff(nodata, model_results, input_dir, output_dir, gap)
        all_image_list.extend(image_list)
        final_data[gap] = model_results.to_dict(orient='list')
    
    # delete_contents(base_dir)
    return {
            "image_path": all_image_list,
            "data":final_data
            }

################################# Calculate Average of S1 and HLS #######################################
def average_rasters(result_S1, result_S2, output_raster_path):
    with rasterio.open(result_S1) as src:
        src_data = src.read(1)
        src_transform = src.transform
        src_crs = src.crs

        with rasterio.open(result_S2) as target:
            target_data = target.read(1, out_shape=(src.height, src.width), 
                                      resampling=Resampling.nearest)
            target_transform = target.transform
            target_crs = target.crs
            
            if src_transform != target_transform:
                destination = np.empty_like(src_data)
                reproject(
                    source=target_data,
                    destination = destination,
                    src_transform=target_transform,
                    src_crs=target_crs,
                    dst_transform=src_transform,
                    dst_crs=src_crs,
                    resampling=Resampling.nearest
                )
                target_data = destination
    # Calculate the average of both rasters
    average_data = np.where(np.isnan(src_data), target_data, np.where(np.isnan(target_data), src_data, (src_data + target_data) / 2))

    # Save the new raster with the same properties as the source raster
    with rasterio.open(
        output_raster_path,
        'w',
        driver='GTiff',
        height=src_data.shape[0],
        width=src_data.shape[1],
        count=1,
        dtype='float32',
        crs=src.crs,
        transform=src_transform,
    ) as output_raster:
        output_raster.write(average_data, 1)
    
    return output_raster_path, average_data.flatten().tolist()
        

def calculate_average(result_s1, result_s2, output_directory):
    
    def find_file_with_keyword(file_list, keyword_gap):
        for file_path in file_list:
            if keyword_gap in file_path:
                return file_path
        return None

    keywords = ["Yield", "CP", "ADF", "NDF", "NDFD"]
    final_data = {}
    all_image_list = []
    
    for gap in range(7):  # Assuming there are 7 gaps
        gap_data = {}
        for keyword in keywords:
            file_s1 = find_file_with_keyword(result_s1, f"S1_{keyword}_gap{gap}")
            file_s2 = find_file_with_keyword(result_s2, f"S2_{keyword}_gap{gap}")

            if file_s1 and file_s2:
                output_raster_path = f"{output_directory}/averaged_{keyword}_gap{gap}.tif"
                output_path, average_data = average_rasters(file_s1, file_s2, output_raster_path)
                # Store the pixel values in the gap_data dictionary
                gap_data[keyword] = average_data
                # Store the path of the averaged raster
                all_image_list.append(output_raster_path)
            else:
                gap_data[keyword] = None
        
        final_data[gap] = gap_data
        
    return {
            "image_path": all_image_list,
            "data": final_data
            }

################################# weather_model #######################################  
def fetch_data(coordinates, date):
    base_url = "https://api.open-meteo.com/v1/forecast"
    
    # Define the parameters
    params = {
        "latitude": coordinates[0][0],
        "longitude": coordinates[0][1],
        "start_date": date,
        "end_date": date,
        "hourly": "temperature_2m",
        "daily": "temperature_2m_max,temperature_2m_min",
        "timezone": "auto"
    }
    
    response = requests.get(base_url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        daily_data = data['daily']
        daily_max_temperatures = daily_data['temperature_2m_max'][0]
        daily_min_temperatures = daily_data['temperature_2m_min'][0]
        return daily_min_temperatures, daily_max_temperatures
    else:
        print(f"Failed to retrieve data for {date}: {response.status_code}")
        return None, None

def YieldModel_Ta(temperature_data):
    Ta_Yield_model = joblib.load("./Database/YieldQuality/Ta_Yield_model.joblib")
    Ta_CP_model = joblib.load("./Database/YieldQuality/Ta_CP_model.joblib")
    Ta_ADF_model = joblib.load("./Database/YieldQuality/Ta_ADF_model.joblib")
    Ta_NDF_model = joblib.load("./Database/YieldQuality/Ta_NDF_model.joblib")
    Ta_NDFD_model = joblib.load("./Database/YieldQuality/Ta_NDFD_model.joblib")

    Ta_Yield = Ta_Yield_model.predict(temperature_data)
    Ta_CP = Ta_CP_model.predict(temperature_data)
    Ta_ADF = Ta_ADF_model.predict(temperature_data)
    Ta_NDF = Ta_NDF_model.predict(temperature_data)
    Ta_NDFD = Ta_NDFD_model.predict(temperature_data)
    
    predictions_Ta = {
        'Yield': Ta_Yield[0],
        'CP': Ta_CP[0],
        'ADF': Ta_ADF[0],
        'NDF': Ta_NDF[0],
        'NDFD': Ta_NDFD[0]
    }
    return predictions_Ta

def data_frame(gap, minimum, maximum):
    data = {
        'gap': [gap],
        'Ta_min': [minimum],
        'Ta_max': [maximum],
    }
    data_df = pd.DataFrame(data)
    return data_df.to_numpy()

def download_one_S1(output_path, field_boundary, date, two_months_ago, predictions, gap):
    ee.Initialize()
    image_list = []
    pixel_data = {}
    
    # Convert dates to string
    date_str = date.strftime("%Y-%m-%d")
    two_months_ago_str = two_months_ago.strftime("%Y-%m-%d")

    # Prepare the field geometry from the boundary coordinates
    coordinates = [[lon, lat] for lat, lon in field_boundary]
    field = ee.Geometry.Polygon(coordinates)
    
    # Load the Sentinel-1 ImageCollection
    sentinel1data = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(field)
        .filterDate(two_months_ago_str, date_str)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .sort('system:time_start', True)  # Sort by acquisition time, True for ascending
    )
    
    # Select the first image from the sorted collection
    first_image = sentinel1data.first()
    vv_image = first_image.select('VV')
    clipped_image = vv_image.clip(field).unmask() #Clip the selected image to the field boundary
    
    for key, value in predictions.items():
        output_file = f"{output_path}Ta_{key}_{gap}.tif"
        image_list.append(output_file)
        
        modified_image = clipped_image.where(clipped_image.lt(1e9), value) #Change pixel value to the yield/quality value
        geemap.ee_export_image(modified_image, filename=output_file, scale=30, region=field, crs='EPSG:4326') #Download the image
        
        # Collect pixel values
        pixel_data[key] = modified_image.reduceRegion(
            reducer=ee.Reducer.toList(),
            geometry=field,
            scale=30,
            maxPixels=1e9
        ).getInfo().get('VV', [])
        
    return image_list, pixel_data

def weather_model(coordinates, today, output_path):
    all_image_list = []
    final_data = {}

    for gap in range(7):
        target_date = today + datetime.timedelta(days=gap)
        one_day_ago = target_date - datetime.timedelta(days=1)
        two_months_ago = target_date - datetime.timedelta(days=60)
        
        minimum, maximum = fetch_data(coordinates, target_date.date())
        if minimum is None or maximum is None:
            continue  # Skip this day if data couldn't be fetched

        input_data = data_frame(gap, minimum, maximum)
        predictions = YieldModel_Ta(input_data)
        image_list, pixel_data = download_one_S1(output_path, coordinates, target_date, two_months_ago, predictions, gap)
        
        all_image_list.extend(image_list)
        final_data[f"gap_{gap}"] = pixel_data

    return {
        "image_path": all_image_list,
        "data": final_data
    }
################################# Implement the code #######################################
@router.post('/model/')
async def run_model(request: Request):
    data = await request.json()
    TileID = data['tile_id']
    UserID = data['user_id']
    FarmID = data['farm_id']
    FieldID = data['field_id']
    coordinates =json.loads(data['boundary'])
    SelectedDate = data['SelectedDate']

    today = datetime.datetime.today()
    selected_date = datetime.datetime.strptime(SelectedDate, "%Y-%m-%d")
    six_days_before = today.date() - datetime.timedelta(days=6)
    gap = abs((today - selected_date).days)

    if gap > 6:
        raise HTTPException(status_code=400, detail='Date must be less than 6 days in the future.')

    base_path_S1 = f"./Sentinel_1/{UserID}/{FarmID}/{FieldID}"
    base_path_S2 = f"./HLS/{UserID}/{FarmID}/{FieldID}"
    output_path = f"./Static/{UserID}/{FarmID}/{FieldID}/"

    os.makedirs(base_path_S1, exist_ok=True)
    os.makedirs(base_path_S2, exist_ok=True)
    os.makedirs(output_path, exist_ok=True)
    
    result_S1 = None
    result_S2 = None
    
    try:
        if download_S1(base_path_S1, coordinates, today.date(), six_days_before):
            result_S1 = Model_S1(base_path_S1, output_path)
        else:
            result_S1 = None
    except Exception as e:
        print(f"Failed to process S1: {str(e)}")
    
    try:
        download_S2(UserID, TileID, FarmID, FieldID, today.date(), six_days_before )
        if processing_S2(base_path_S2, coordinates):
            folder_path = find_most_recent_folder(base_path_S2)
            result_S2 = Model_S2(folder_path, output_path)
        else:
            # print('No valid results from processing_S2, skipping Model_S2.')
            result_S2 = None 
    except Exception as e:
        print(f"Failed to process S2: {str(e)}")
    
    if not result_S1 and not result_S2:
        result_weather = weather_model( coordinates, today, output_path)
        return result_weather
    elif result_S1 and result_S2:
        average_s1_s2 = calculate_average(result_S1['image_path'], result_S2['image_path'], output_path)
        return average_s1_s2
    elif result_S1:
        return result_S1
    elif result_S2:
        return result_S2
    
