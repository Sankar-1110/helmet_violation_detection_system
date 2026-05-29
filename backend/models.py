from sqlalchemy import Column, Integer, String
from database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True)
    owner_name = Column(String)
    mobile_number = Column(String)

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String)
    helmet = Column(String)
    ocr_status = Column(String)
    confidence = Column(String)
    image_path = Column(String)
    final_image_path = Column(String)
    notification = Column(String)
    timestamp = Column(String)