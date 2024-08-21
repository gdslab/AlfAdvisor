from fastapi import FastAPI, Form, File, UploadFile, Request, Body, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTasks
from dotenv import load_dotenv
load_dotenv()

from fastapi.encoders import jsonable_encoder
from typing import List
from pydantic import BaseModel
import geopandas , zipfile
import geojson, shutil, glob, json, os, getpass, re
# import asf_search as asf
# from asf_search.exceptions import ASFSearchError
from os import listdir, getenv
from datetime import date
import rioxarray, rasterio
from shapely.geometry import mapping
from fastapi.middleware.cors import CORSMiddleware
from Database import dataMain
from Database import farm, field, YieldModel, EconomicModel
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session 
from Database.database import engine, SessionLocal
from Database import models
import math
import requests
from datetime import datetime , timedelta
import gdal

app = FastAPI ()
models.Base.metadata.create_all (bind = engine)

origins = getenv('ORIGINS').split(';')

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials= True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the directory using StaticFiles to serve the images
app.mount("/Static", StaticFiles(directory='Static'), name="Static")


app.include_router(dataMain.router)
app.include_router(farm.router)
app.include_router(field.router)
app.include_router(YieldModel.router)
app.include_router(EconomicModel.router)



def get_coordinates ():
    with open("./data/FieldBoundry.geojson") as f:
        gj = geojson.load(f)
        features = gj['features'][0]['geometry']["coordinates"][0]
    return features

def get_coordinates_Polygon (g):
    with open(g) as f:
        gj = geojson.load(f)
        coordin = gj['geometry']["coordinates"][0]
    return coordin

@app.get('/alfalfa/test')
def field_coordinates ():
    field_coordinate = []
    with open('./Coordinates.json') as field:
        field_boundry = geojson.load(field)
        for i in range(len(field_boundry)):
            lat = field_boundry [i][0]
            lng = field_boundry [i][1]
            location = f'{lng} {lat},'
            field_coordinate.append(location)
    # for j in range(len(field_coordinate)):
    #     array = 'POLYGON((
    # print(field_coordinate[:-1])
    # re.sub()
    s = ''.join (str(x) for x in field_coordinate)
    return s [:-1]


@app.post("/alfalfa/api/")
async def index (files: List[UploadFile] = File (...)):
    filenames = []
    for fil in files:
        with open (f'{fil.filename}', "wb") as buffer:
            # content = fil.file.read()
            # buffer.write(content)
            shutil.copyfileobj(fil.file, buffer)
            
    for fname in glob.glob("*.shp"):
        myshpfile = geopandas.read_file(fname)
        myshpfile.to_file("./data/FieldBoundry.geojson", driver='GeoJSON')
        coordinates = get_coordinates()
    
        for shp1 in glob.glob("*.shp"):
            os.remove(shp1)
        for shx1 in glob.glob("*.shx"):
            os.remove(shx1)
        for dbf1 in glob.glob("*.dbf"):
            os.remove(dbf1)
        for prj1 in glob.glob("*.prj"):
            os.remove(prj1)
    
    LatLong = []
    for i in range(len(coordinates)):
        lat = coordinates [i][1]
        lng = coordinates [i][0]
        LatLong.append([lat, lng])
    json_string = json.dumps(LatLong)
    with open('./data/fieldCoordinates.json', 'w') as outfile:
        outfile.write(json_string)
    print(LatLong)
    return {"coordinates": LatLong}


def get_db ():
    try:
        db = SessionLocal ()
        yield db
    finally:
        db.close ()

@app.post("/alfalfa/FieldBoundary/")
async def downloadFile (BoundryCoordinates: Request):
    # print("we got the data")
    inputBoudCoor = await BoundryCoordinates.body()
    BoundCoorToJSON = jsonable_encoder (inputBoudCoor)
    jsonFileName = './Coordinates.json'
    with open('./FieldBoundry.geojson', 'w') as f:
        f.write(BoundCoorToJSON)
    
    polygon_coordinates = get_coordinates_Polygon('./FieldBoundry.geojson')
    LatLng = []
    for i in range(len(polygon_coordinates)):
        lat = polygon_coordinates [i][1]
        lng = polygon_coordinates [i][0]
        LatLng.append([lat, lng])
    polygon_coordinate = json.dumps (LatLng)
    
    with open(jsonFileName, 'w') as f:
        f.write(polygon_coordinate)
    
    srcDS = gdal.OpenEx(BoundCoorToJSON)
    ds = gdal.VectorTranslate('shapefileTest.shp', srcDS, format='ESRI Shapefile')
    
    return polygon_coordinate
    
    
@app.get("/alfalfa/downloadjson/")
def download_json_file():
    file_path = "./FieldBoundry.geojson"
    return FileResponse(file_path, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename=file_path)

@app.get("/downloadshapfile/")
def download_shapefile ():
    file_list = ['./shapefileTest.dbf', './shapefileTest.shp', './shapefileTest.shx', './shapefileTest.prj']
    with zipfile.ZipFile('Shapefile.zip', 'w') as zip:
        for file in file_list:
            zip.write(file, compress_type=zipfile.ZIP_DEFLATED)
    # for shp in glob.glob("*.shp"):
    #     os.remove(shp)
    # for shx in glob.glob("*.shx"):
    #     os.remove(shx)
    # for dbf in glob.glob("*.dbf"):
    #     os.remove(dbf)
    # for prj in glob.glob("*.prj"):
    #     os.remove(prj)
    # for zi in glob.glob("*.zip"):
    #     os.remove(zi)
        
    return FileResponse("./Shapefile.zip", media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename="./Shapefile.zip")


@app.get("/alfalfa/WeatherInfo/")
def get_coordinates_data ():
    with open("./Coordinates.json") as f:
            coordinate = geojson.load(f)
            features = coordinate[0]
    return features


@app.post('/alfalfa/weatherData/')
async def save_weather_data (weather: Request):
    weatherData = await weather.body()
    WeatherD = jsonable_encoder (weatherData)
    with open('./WeatherData.json', 'w') as f:
        f.write(WeatherD)
    return {"message:", "successfully saved."}


@app.get("/alfalfa/GetWeatherInfo/")
def get_coordinates_data (Request:Request):
    with open("./WeatherData.json") as f:
        weatherInformation = geojson.load(f)
    return weatherInformation


