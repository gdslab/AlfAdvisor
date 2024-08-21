from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, Date, ForeignKey
from pydantic import BaseModel, EmailStr

from .database import Base



class Users (Base):
    __tablename__ = "users"
    
    id = Column (String(), primary_key = True, unique=True)
    email = Column (String (255), nullable = False, unique=True)
    first_name = Column (String (255), nullable = False)
    last_name = Column (String (255), nullable = False)
    hashed_password = Column (String (255), nullable= False, unique = True)
    # is_active = Column (Boolean)
    # is_superuser = Column (Boolean)
    # is_verified = Column (Boolean)
    

class Farms (Base):
    __tablename__ = "farms"
    
    id = Column (Integer(), primary_key = True, unique=True)
    name = Column(String(255), nullable = False) #Farm name
    lon = Column (Float)
    lat = Column (Float)
    owner_id = Column (Integer, nullable=False)
    
    
class Fields (Base):
    __tablename__ = "fields"
    
    id = Column (Integer(), primary_key = True, unique=True)
    name = Column (String (255))
    lon = Column (Float ())
    lat = Column (Float ())
    boundary_path = Column (String ())
    farm_id = Column (Integer (), nullable=False) #ForeignKey ("users.id")


class Images (Base):
    __tablename__ = "images"
    
    id = Column (Integer(), primary_key = True)
    date = Column (Date)
    Image_path = Column (String ())
    field_id = Column (Integer ())


class Predictions (Base):
    __tablename__ = "predictions"
    
    id = Column (Integer(), primary_key = True)
    model_running_date = Column (DateTime)
    dmy_path = Column (String(255))
    ndf_path = Column (String(255))
    ndfd_path = Column (String(255))
    afd_path = Column (String(255))
    cp_path = Column (String(255))
    field_id = Column (Integer (), unique = True)


class Plantings (Base):
    __tablename__ = "plantings"
    
    id = Column (Integer(), primary_key = True)
    planting_date = Column (DateTime)
    field_id = Column (Integer (), unique = True)


class Harvetings (Base):
    __tablename__ = "harvestings"
    
    id = Column (Integer(), primary_key = True)
    harvesting_date = Column (DateTime)
    field_id = Column (Integer (), unique = True)

