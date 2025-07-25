
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

class PaymentStatusEnum(str, enum.Enum):
    unpaid = "未支付"
    paid = "已支付"


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


from sqlalchemy import Enum as SqlEnum
import enum

class ExitStatusEnum(str, enum.Enum):
    not_exit = "未离场"
    exited = "已离场"

class ReviewStatusEnum(str, enum.Enum):
    pending = "待审核"
    approved = "已通过"
    rejected = "已拒绝"

class ParkingEntry(Base):
    __tablename__ = "parking_entries"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    entry_time = Column(DateTime, default=datetime.utcnow)
    exit_status = Column(SqlEnum(ExitStatusEnum), default=ExitStatusEnum.not_exit)
    review_status = Column(SqlEnum(ReviewStatusEnum), default=ReviewStatusEnum.pending)
    review_reply = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    slot = relationship("ParkingSlot")
    user = relationship("User")


class ParkingExit(Base):
    __tablename__ = "parking_exits"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("parking_entries.id"), unique=True)
    exit_time = Column(DateTime, nullable=True)
    duration = Column(Float)  # 小时
    payment_status = Column(SqlEnum(PaymentStatusEnum), default=PaymentStatusEnum.unpaid)
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("ParkingEntry")