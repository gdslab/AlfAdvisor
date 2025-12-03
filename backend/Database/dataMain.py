import os
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

def create_access_token (user_email: str, user_id: int, expires_delta: timedelta):
    
    encode = {'sub': user_email, 'id': user_id}
    expires = datetime.utcnow() + expires_delta 
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRETE_KEY, algorithm= ALGORITHM)


def get_current_user(token: Annotated[str, Depends(oauth2_bearer)], db: Session = Depends(get_db)):
    try:
        
        payload = jwt.decode(token, SECRETE_KEY, algorithms= [ALGORITHM])
        email : str = payload.get('sub')
        user_id : int = payload.get('id')
        if email is None or user_id is None:
            raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail = 'Could not find user')
        
        user = db.query(models.Users).filter(models.Users.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return {'email': email, 'id': user_id, 'is_superuser': user.is_superuser}
    except JWTError:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail= 'Could not validate user')
        

def update_user_password(db: Session, superuser_id: str, user_id: str, new_password: str):
    superuser = db.query(models.Users).filter(models.Users.id == superuser_id).first()
    if not superuser or not superuser.is_superuser:
        raise HTTPException(status_code=403, detail="Only superusers can change user passwords.")

    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = bcrypt_context.hash(new_password)
    db.commit()
    return {"message": "Password updated successfully."}
        
class User (BaseModel):
    id: str
    email : str
    first_name : Optional [str]
    last_name : Optional [str]
    hashed_password : str
    is_superuser: Optional[bool]
    
class UserLogin (BaseModel):
    email: str
    hashed_password : str
    
class PasswordUpdateSchema(BaseModel):
    user_id: str
    new_password: str


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
    existing_user = db.query(models.Users).filter(models.Users.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_model = models.Users ()
    user_model.id = user.id
    user_model.email = user.email
    user_model.first_name = user.first_name
    user_model.last_name = user.last_name
    user_model.hashed_password = bcrypt_context.hash(user.hashed_password)
    user_model.is_superuser = user.is_superuser
    
    db.add(user_model)
    db.commit ()
    db.refresh(user_model)
    return {"message": "User registered successfully"}

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
    return {'access_token':token, 'token_type': 'bearer', 'first_name': first_name, 'last_name': last_name, 'user_id': userID}

# ----------------------------------------------------------------
@router.put("/superuser/update-password", status_code=200)
async def superuser_update_password(
    request: PasswordUpdateSchema,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user["is_superuser"]:
        raise HTTPException(status_code=403, detail="Superuser privileges required.")

    return update_user_password(db, current_user["id"], request.user_id, request.new_password)

# ----------------------------------------------------------------
@router.get("/check-superuser")
async def check_superuser(current_user: dict = Depends(get_current_user)):
    return {"is_superuser": current_user["is_superuser"]}

# ----------------------------------------------------------------
@router.get("/get-users")
async def get_users(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not current_user["is_superuser"]:
        raise HTTPException(status_code=403, detail="Superuser privileges required.")
    users = db.query(models.Users).all()
    return users

# ----------------------------------------------------------------
@router.put("/update-password")
async def update_password(
    request: PasswordUpdateSchema, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not current_user["is_superuser"]:
        raise HTTPException(status_code=403, detail="Superuser privileges required.")

    # Find the user
    user = db.query(models.Users).filter(models.Users.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = bcrypt_context.hash(request.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

# ----------------------------------------------------------------
@router.get("/getCoodinates/{id}")
async def getCoodinates (id : int, db: Session = Depends (get_db)):
    field_model = db.query(models.Fields).filter(models.Fields.id == id).first()
    path = field_model.boundary_path 
    with open(path) as f:
        LatLng = geojson.load(f)
    return LatLng