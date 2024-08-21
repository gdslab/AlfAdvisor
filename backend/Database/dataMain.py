# import sys
# sys.path.append("..")s

import os
print ("this is system path",os.getcwd())

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Form
from datetime import datetime, timedelta
from Database import models
from .database import engine, SessionLocal
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import  Optional
from typing_extensions import Annotated
import geojson,glob, json
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from starlette import status

router = APIRouter(
    prefix='/alfalfa/auth',
    tags=['auth']
)

SECRETE_KEY = '793188ec31f0a30fa4f3f7c17bceeaa64d2f896315328ad10aa780a9e570900d'
ALGORITHM = 'HS256'

models.Base.metadata.create_all (bind = engine)

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer (tokenUrl='auth/token')


def get_db ():
    try:
        db = SessionLocal ()
        yield db
    finally:
        db.close ()

# db_dependency = Annotated[Session, Depends(get_db)]
# user_dependency = Annotated[dict, Depends(get_create_user)]

def create_access_token (user_email: str, user_id: int, expires_delta: timedelta):
    
    encode = {'sub': user_email, 'id': user_id}
    expires = datetime.utcnow() + expires_delta 
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRETE_KEY, algorithm= ALGORITHM)


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        
        payload = jwt.decode(token, SECRETE_KEY, algorithms= [ALGORITHM])
        email : str = payload.get('sub')
        user_id : int = payload.get('id')
        if email is None or user_id is None:
            raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail = 'Could not find user')
        
        return {'email': email, 'id':user_id}
    except JWTError:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail= 'Could not validate user')
        
        
class User (BaseModel):
    id: str
    email : str
    first_name : Optional [str]
    last_name : Optional [str]
    hashed_password : str
    # is_active : bool 
    # is_superuser: bool
    # is_verified : bool
    
class UserLogin (BaseModel):
    email: str
    hashed_password : str


class Token (BaseModel):
    access_token: str
    token_type: str
    first_name: str
    last_name: str
    user_id: str

    
@router.get ("/read/")
async def read_all ( db: Session = Depends (get_db)):
    return db.query(models.Users).all()

# ----------------------------------------------------------------
@router.post("/register/", status_code=status.HTTP_201_CREATED)
async def create_user (user : User, db: Session = Depends (get_db)):
    user_model = models.Users ()
    user_model.id = user.id
    user_model.email = user.email
    user_model.first_name = user.first_name
    user_model.last_name = user.last_name
    user_model.hashed_password = bcrypt_context.hash(user.hashed_password)
    # user_model.is_active = user.is_active
    # user_model.is_superuser = user.is_superuser
    # user_model.is_verified = user.is_verified
    
    db.add(user_model)
    db.commit ()

# ---------------------------------------------------------------
@router.post("/login/{email}", response_model=Token)
async def user_login (email : str, user: UserLogin, db: Session = Depends (get_db)):
    user_model = db.query(models.Users).filter(models.Users.email == email).first()
    
    if not user_model:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail = 'Could not find user')
    
    if not bcrypt_context.verify(user.hashed_password,user_model.hashed_password):
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail = 'Could not validate user')
    
    token = create_access_token(user.email, user_model.id, timedelta(minutes=60))
    userID = user_model.id
    first_name = user_model.first_name
    last_name = user_model.last_name
    print(user_model.first_name,user_model.last_name)
    return {'access_token':token, 'token_type': 'bearer', 'first_name': first_name, 'last_name': last_name, 'user_id': userID}
        
    # if (user_model.email == user.email and user_model.hashed_password == user.hashed_password):
    #     return {
    #         "status" : 201,
    #         'transaction' : 'Successful'
    #         }
    # else: 
    #     # return {
    #     #     "status" : 400,
    #     #     'transaction' : 'Successful'
    #     #     }
    #     raise HTTPException (status_code = 400)
        
        
# @router.get('/table/')
# async def send_to_db ( db: Session = Depends (get_db)):
#     # os.chdir ("/mnt/alfalfa_bv_ad3/backend")
#     for jfile in glob.glob ("Coo"+"*.json"):
#         field_filter = db.query(models.Fields).filter(models.Fields.field_name == jfile).first()
#         # print ("farm filter is",farm_filter.farm_name)
        
#         if field_filter is None: 
#         # if farm_filter.farm_name
#             json_path = os.path.abspath (jfile)
#             print (json_path)
            
#             with open (jfile) as f:
#                 coordinate = geojson.load(f)
#                 print (coordinate)
#             # return coordinate
        
#             field_model = models.Fields ()
#             field_model.field_name = jfile
#             field_model.lon = coordinate [0][1]
#             field_model.lat = coordinate [0][0]
#             field_model.boundary_path = json_path
#             db.add(field_model)
#             db.commit()
        
#     print ("farm data sent to db")
#     return db.query(models.Fields).all()

# ----------------------------------------------------------------

@router.get("/getCoodinates/{id}")
async def getCoodinates (id : int, db: Session = Depends (get_db)):
    field_model = db.query(models.Fields).filter(models.Fields.id == id).first()
    path = field_model.boundary_path 
    # print (path)
    with open(path) as f:
        LatLng = geojson.load(f)
    return LatLng