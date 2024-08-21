
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Path, Request
from Database import models
from .database import engine, SessionLocal
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import  Optional
from typing_extensions import Annotated
import geojson,glob, json
from .dataMain import get_current_user
from starlette import status
from datetime import datetime, date

router = APIRouter(
    prefix='/alfalfa/{farm_id}/field',
    tags=['field']
)

def get_db():
    try:
        db = SessionLocal ()
        yield db
    finally:
        db.close ()


class Field (BaseModel):
    name: str
    lon : float
    lat : float 
    boundary_path : str

class Farm (BaseModel):
    name: str
    
class updateField (BaseModel):
    name: str
    
class ShapefileData(BaseModel):
    boundary_path: str
    

class Image (BaseModel):
    date : date
    path : str

# ------------------------------ Field --------------------------------
@router.post('/create', status_code = status.HTTP_201_CREATED)
async def create_field(farm_id: int, new_field: Field, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    Farm_model = db.query(models.Farms).filter(models.Farms.owner_id == user.get('id')).filter(models.Farms.id == farm_id).first()
    if not Farm_model:
        raise HTTPException(status_code=404, detail='Farm not found')
    Field_model = models.Fields (**new_field.dict(), farm_id = farm_id)
    
    db.add(Field_model)
    db.commit()

# ---------------------------------------------------------------------
@router.get ("/read/")    # Reading fields based on user_id
async def read_all_field ( farm_id: int, user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    return db.query(models.Fields).join(models.Farms, models.Fields.farm_id == models.Farms.id).filter(models.Farms.owner_id == user.get('id')).filter(models.Fields.farm_id == farm_id).all()

# db.query(models.Fields).filter(models.Farms.owner_id == user.get('id')).filter(models.Fields.farm_id == farm_id).all()

#-----------------------------------------------------------------------
@router.get ("/read/{field_id}") # Reading one field based on field_id
async def read_one_field (field_id : int ,user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    field = db.query(models.Fields).filter(models.Fields.id == field_id).filter(models.Fields.owner_id == user.get('id')).first()
    if field is not None:
        return field
    raise HTTPException(status_code=404, detail='Field not found')

# ----------------------------------------------------------------------
@router.put("/{field_id}/update")
async def update_field (farm_id: int, field_id : int, field: Field ,user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    
    field_model = db.query(models.Fields).filter(models.Fields.id == field_id).filter(models.Fields.farm_id == farm_id).filter(models.Farms.owner_id == user.get('id')).first()
    if field_model is None:
        raise HTTPException(status_code=404, detail='Field not found')
    
    field_model.name = field.name
    field_model.lon = field.lon
    field_model.lat = field.lat
    field_model.boundary_path = field.boundary_path
    
    db.add(field_model)
    db.commit()
    
# ----------------------------------------------------------------------
@router.delete("/{field_id}/delete") # Deleting field based on field_id
async def delete_field ( farm_id: int, field_id : int ,user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    
    field = db.query(models.Fields).filter(models.Fields.farm_id == farm_id).filter(models.Fields.id == field_id).filter(models.Farms.owner_id == user.get('id')).first()
    if field is None:
        raise HTTPException(status_code=404, detail='Field not found')
    # db.query(models.Fields).filter(models.Fields.farm_id == farm_id).filter(models.Fields.id == field_id).filter(models.Farms.owner_id == user.get('id'))
    
    db.delete(field)
    db.commit()
    
# ----------------------------------------------------------------------
@router.post("/check_shapefile_exists")
async def check_shapefile_exists(farm_id: int, shapefile_data: ShapefileData, user: dict = Depends(get_current_user), db: Session = Depends (get_db)) :
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    
    coordinates = shapefile_data.boundary_path
    exists_in_database= db.query(models.Fields).filter(models.Fields.farm_id == farm_id).filter(models.Fields.boundary_path == coordinates).filter(models.Farms.owner_id == user.get('id')).first()
    
    if exists_in_database is None:
        return None
    
    if exists_in_database is not None:
        raise HTTPException(status_code=409, detail='Field is already existed. Please upload a different shapefile.')
    
# ----------------------------------------------------------------------
@router.post("/{field_id}/images")
async def model_result (farm_id: int, field_id : int ,new_image : Image, user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        print ('auth failed')
        raise HTTPException(status_code=401, detail='Authentication failed')
    
    field = db.query(models.Fields).filter(models.Fields.id == field_id).filter(models.Fields.farm_id == farm_id).filter(models.Farms.owner_id == user.get('id')).first()
    if field is None:
        print ('field not found')
        raise HTTPException(status_code=404, detail='Field not found')
    
    exists_in_database= db.query(models.Images).filter(models.Images.field_id == field_id).filter(models.Images.Image_path == new_image.path).first()
    
    # if exists_in_database is not None:
    #     raise HTTPException(status_code=409, detail='The result has already been stored in the database.')
    
    Image_model = models.Images(date=new_image.date, Image_path=new_image.path, field_id=field_id)
    
    db.add(Image_model)
    db.commit()
    
# ----------------------------------------------------------------------
@router.get("/{field_id}/GetImages")
async def get_images(farm_id: int, field_id : int , request: Request,user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    
    field = db.query(models.Fields).filter(models.Fields.id == field_id).filter(models.Fields.farm_id == farm_id).filter(models.Farms.owner_id == user.get('id')).first()
    if field is None:
        raise HTTPException(status_code=404, detail='Field not found')
    
    images = db.query(models.Images).filter(models.Images.field_id == field_id).all()
    
    image_urls = []
    for image in images:
        image_url = request.url_for("Static", path=image.Image_path)
        image_urls.append(image_url)
    
    print(image_urls)
    return image_urls