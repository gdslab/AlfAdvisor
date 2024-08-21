
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Path
from Database import models
from .database import engine, SessionLocal
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import  Optional
from typing_extensions import Annotated
import geojson,glob, json
from .dataMain import get_current_user
from starlette import status

router = APIRouter(
    prefix='/alfalfa/farm',
    tags=['farm']
)

def get_db():
    try:
        db = SessionLocal ()
        yield db
    finally:
        db.close ()


class Farm (BaseModel):
    name: str
    lon : float
    lat : float 

# ------------------------------ Farm --------------------------------
@router.post('/create', status_code = status.HTTP_201_CREATED)
async def create_farm(new_farm: Farm, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    Farm_model = models.Farms (**new_farm.dict(), owner_id = user.get('id'))
    
    db.add(Farm_model)
    db.commit()

# ---------------------------------------------------------------------
@router.get ('/read/')    # Reading all farms based on user_id
async def read_all_farm ( user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    return db.query(models.Farms).filter(models.Farms.owner_id == user.get('id')).all()

#-----------------------------------------------------------------------
# @router.get ("/{farm_id}/read") # Reading All fields inside a farm based on farm_id
# async def read_one_farm (farm_id : int ,user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
#     if user is None:
#         raise HTTPException(status_code=401, detail='Authentication failed')
#     farm = db.query(models.Farms).filter(models.Farms.id == farm_id).filter(models.Farms.owner_id == user.get('id')).first()
#     if farm is not None:
#         return farm
#     raise HTTPException(status_code=404, detail='Farm not found')

# ----------------------------------------------------------------------
@router.put("/{farm_id}/update")
async def update_farm(farm_id : int, farm: Farm ,user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    
    farm_model = db.query(models.Farms).filter(models.Farms.id == farm_id).filter(models.Farms.owner_id == user.get('id')).first()
    if farm_model is None:
        raise HTTPException(status_code=404, detail='Farm not found')
    
    # farm_model.id = farm_id
    farm_model.name = farm.name
    # Preserve the existing lat and lon values
    farm_model.lat = farm.lat 
    farm_model.lon = farm.lon 
    
    db.add(farm_model)
    db.commit()
    
# ----------------------------------------------------------------------
@router.delete("/{farm_id}/delete") # Deleting farm based on farm_id
async def delete_farm (farm_id : int ,user: dict = Depends(get_current_user), db: Session = Depends (get_db)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    
    farm = db.query(models.Farms).filter(models.Farms.id == farm_id).filter(models.Farms.owner_id == user.get('id')).first()
    field = db.query(models.Fields).filter(models.Farms.owner_id == user.get('id')).filter(models.Fields.farm_id == farm_id).all()
    print(field)
    if farm is None:
        raise HTTPException(status_code=404, detail='Farm not found')
    db.query(models.Farms).filter(models.Farms.id == farm_id).filter(models.Farms.owner_id == user.get('id')).delete()
    db.query(models.Fields).filter(models.Fields.farm_id == farm_id).delete()
    
    db.commit()