from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
from models.base import Base
import enum


class SlotStatusEnum(str, enum.Enum):
    free = "free"
    occupy = "occupy"
    repair = "repair"


class ChargeRuleEnum(str, enum.Enum):
    hour = "hour"
    month = "month"

class ReservationStatusEnum(str, enum.Enum):
    reserving = "reserving"
    entered = "entered"
    exited = "exited"


class ParkingSlotType(Base):
    __tablename__ = "parking_slot_types"

    id = Column(Integer, primary_key=True, index=True)
    type_name = Column(String(50), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_number = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    type_id = Column(Integer, ForeignKey("parking_slot_types.id"))
    location = Column(Integer, ForeignKey("parkings.id"))
    charge_rule = Column(Enum(ChargeRuleEnum), nullable=False)
    price_per_hour = Column(Float)
    status = Column(Enum(SlotStatusEnum), default=SlotStatusEnum.free)
    avatar1 = Column(String(200))
    avatar2 = Column(String(200))
    avatar3 = Column(String(200))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    type = relationship("ParkingSlotType")
    parking = relationship("Parking")


class ParkingReservation(Base):
    __tablename__ = "parking_reservations"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"))
    license_plate = Column(String(50), nullable=False)
    reserved_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(ReservationStatusEnum), default=ReservationStatusEnum.reserving)

    slot = relationship("ParkingSlot")


class ParkingEntry(Base):
    __tablename__ = "parking_entries"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"))
    user_id = Column(Integer, nullable=False)
    license_plate = Column(String(50), nullable=False)
    entry_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="未离场")
    audit_status = Column(String(20), default="待审核")
    audit_reply = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    slot = relationship("ParkingSlot")


class ParkingExit(Base):
    __tablename__ = "parking_exits"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("parking_entries.id"))
    exit_time = Column(DateTime, default=datetime.utcnow)
    duration = Column(Float)  # 小时
    price_per_hour = Column(Float)
    total_fee = Column(Float)
    payment_status = Column(String(20), default="未支付")
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("ParkingEntry")