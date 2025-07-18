from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(128), nullable=False)
    name = Column(String(50))
    avatar1 = Column(String(255))
    avatar2 = Column(String(255))
    avatar3 = Column(String(255))
    gender = Column(Enum("男", "女", "保密"), default="保密")
    phone = Column(String(20))
    plate = Column(String(20))
    role = Column(Enum("user", "admin"), default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())