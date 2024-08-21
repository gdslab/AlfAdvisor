from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os 
from dotenv import load_dotenv


# BASE_DIR = os.path.dirname(os.path.realpath(__file__))
BASE_DIR = os.getenv('DB_BASE_DIR')
SQLALCHEMY_DATABASE_URL = "sqlite:///"+os.path.join(BASE_DIR, 'Data.db')


engine = create_engine (
    SQLALCHEMY_DATABASE_URL,  connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker (autocommit=False, autoflush = False, bind = engine)

Base = declarative_base()