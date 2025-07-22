from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base

from models.base import Base
class Parking(Base):
    __tablename__ = "parkings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    cover = Column(String(255))
    floor = Column(String(50))
    type = Column(String(50))  # 地下、室内、室外
    slots = Column(Integer)
    facilities = Column(String(255))
    charge = Column(String(100))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)