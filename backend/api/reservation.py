import hashlib
import os

from fastapi import APIRouter, Request, Form, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from db import SessionLocal
from models.reservation import ParkingSlotType, ParkingSlot
from datetime import datetime
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from models.user import User
from middleware.user import get_current_user

templates = Jinja2Templates(directory="templates")

router = APIRouter()

@router.get("/reservation/slots", response_class=HTMLResponse)
async def reservation_slots_page(request: Request, current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("reservation/parking_slots.html", {
        "request": request,
        "current_user": current_user
    })

@router.get("/reservation/slot_types", response_class=HTMLResponse)
async def reservation_slot_types_page(request: Request, current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("reservation/slot_types.html", {
        "request": request,
        "current_user": current_user
    })

@router.get("/reservation/reservations", response_class=HTMLResponse)
async def reservation_reservations_page(request: Request, current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("reservation/reservations.html", {
        "request": request,
        "current_user": current_user
    })

@router.get("/reservation/entries", response_class=HTMLResponse)
async def reservation_entries_page(request: Request, current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("reservation/entries.html", {
        "request": request,
        "current_user": current_user
    })

@router.get("/reservation/exits", response_class=HTMLResponse)
async def reservation_exits_page(request: Request, current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("reservation/exits.html", {
        "request": request,
        "current_user": current_user
    })

@router.get("/api/reservation/slot_types")
async def list_slot_types():
    db: Session = SessionLocal()
    data = db.query(ParkingSlotType).order_by(ParkingSlotType.id.desc()).all()
    db.close()
    return JSONResponse(content=[
        {"id": t.id, "type_name": t.type_name, "created_at": t.created_at.isoformat()}
        for t in data
    ])


@router.post("/api/reservation/slot_types/add")
async def add_slot_type(
    type_name: str = Form(...),
    description: str = Form(default="")
):
    db: Session = SessionLocal()
    slot_type = ParkingSlotType(
        type_name=type_name,
        description=description,
        created_at=datetime.utcnow()
    )
    db.add(slot_type)
    db.commit()
    db.refresh(slot_type)
    db.close()
    return {"message": "添加成功", "id": slot_type.id}


@router.get("/api/reservation/slot_types/detail")
async def get_slot_type_detail(id: int):
    db: Session = SessionLocal()
    slot_type = db.query(ParkingSlotType).filter(ParkingSlotType.id == id).first()
    db.close()
    if not slot_type:
        return JSONResponse(status_code=404, content={"message": "未找到该类型"})
    return {
        "id": slot_type.id,
        "type_name": slot_type.type_name,
        "description": slot_type.description,
        "created_at": slot_type.created_at.isoformat()
    }


@router.post("/api/reservation/slot_types/edit")
async def edit_slot_type(
    id: int = Form(...),
    type_name: str = Form(...),
    description: str = Form(default="")
):
    db: Session = SessionLocal()
    slot_type = db.query(ParkingSlotType).filter(ParkingSlotType.id == id).first()
    if not slot_type:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该类型"})
    slot_type.type_name = type_name
    slot_type.description = description
    db.commit()
    db.close()
    return {"message": "修改成功"}


@router.delete("/api/reservation/slot_types/delete")
async def delete_slot_type(id: int):
    db: Session = SessionLocal()
    slot_type = db.query(ParkingSlotType).filter(ParkingSlotType.id == id).first()
    if not slot_type:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该类型"})
    db.delete(slot_type)
    db.commit()
    db.close()
    return {"message": "删除成功"}


# 车位信息相关 API
from datetime import datetime

@router.get("/api/reservation/slots")
async def list_parking_slots(page: int = 1, page_size: int = 10):
    db: Session = SessionLocal()
    # 构建类型和停车场名称映射
    type_map = {t.id: t.type_name for t in db.query(ParkingSlotType).all()}
    from models.parkings import Parking  # 添加这行
    parking_map = {p.id: p.name for p in db.query(Parking).all()}

    # 状态映射
    status_map = {
        "free": "空闲",
        "occupy": "占用",
        "repair": "维修"
    }

    total = db.query(ParkingSlot).count()
    slots = db.query(ParkingSlot).order_by(ParkingSlot.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    db.close()
    return JSONResponse(content={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": s.id,
                "slot_number": s.slot_number,
                "name": s.name,
                "type_name": type_map.get(s.type_id, ""),
                "parking_name": parking_map.get(s.location, ""),
                "charge_rule": s.charge_rule,
                "price_per_hour": s.price_per_hour,
                "status": status_map.get(s.status, s.status),
                "description": s.description,
                "avatar1": s.avatar1,
                "avatar2": s.avatar2,
                "avatar3": s.avatar3,
                "created_at": s.created_at.isoformat(),
            } for s in slots
        ]
    })

def save_avatar_file(file: UploadFile, upload_dir: str = "static/upload") -> str:
    content = file.file.read()
    ext = os.path.splitext(file.filename)[-1].lower()
    sha1_name = hashlib.sha1(content).hexdigest() + ext
    file_path = os.path.join(upload_dir, sha1_name)
    with open(file_path, "wb") as f:
        f.write(content)
    return hashlib.sha1(content).hexdigest() + ext

@router.post("/api/reservation/slots/add")
async def add_parking_slot(
    slot_number: str = Form(...),
    name: str = Form(...),
    type_id: int = Form(...),
    location: int = Form(...),
    charge_rule: str = Form(...),
    price_per_hour: float = Form(...),
    status: str = Form(...),
    description: str = Form(default=""),
    avatar1: UploadFile = File(None),
    avatar2: UploadFile = File(None),
    avatar3: UploadFile = File(None),
):
    db: Session = SessionLocal()
    slot = ParkingSlot(
        slot_number=slot_number,
        name=name,
        type_id=type_id,
        location=location,
        charge_rule=charge_rule,
        price_per_hour=price_per_hour,
        status=status,
        description=description,
        created_at=datetime.utcnow()
    )

    if avatar1:
        slot.avatar1 = save_avatar_file(avatar1)
    if avatar2:
        slot.avatar2 = save_avatar_file(avatar2)
    if avatar3:
        slot.avatar3 = save_avatar_file(avatar3)
    print("这里的slot的值为：", slot)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    db.close()
    return {"message": "添加成功", "id": slot.id}

@router.get("/api/reservation/slots/detail")
async def get_parking_slot_detail(id: int):
    from models.parkings import Parking  # 确保导入 Parking 模型

    status_map = {
        "free": "空闲",
        "occupy": "占用",
        "repair": "维修"
    }

    db: Session = SessionLocal()
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == id).first()
    if not slot:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该车位"})

    type_obj = db.query(ParkingSlotType).filter(ParkingSlotType.id == slot.type_id).first()
    parking_obj = db.query(Parking).filter(Parking.id == slot.location).first()

    result = {
        "id": slot.id,
        "slot_number": slot.slot_number,
        "name": slot.name,
        "type_id": slot.type_id,
        "type_name": type_obj.type_name if type_obj else "",
        "location": slot.location,
        "parking_name": parking_obj.name if parking_obj else "",
        "charge_rule": slot.charge_rule,
        "price_per_hour": slot.price_per_hour,
        "status": status_map.get(slot.status, slot.status),
        "description": slot.description,
        "avatar1": slot.avatar1,
        "avatar2": slot.avatar2,
        "avatar3": slot.avatar3,
        "created_at": slot.created_at.isoformat(),
    }
    db.close()
    return result

@router.post("/api/reservation/slots/edit")
async def edit_parking_slot(
    id: int = Form(...),
    slot_number: str = Form(...),
    name: str = Form(...),
    type_id: int = Form(...),
    location: int = Form(...),
    charge_rule: str = Form(...),
    price_per_hour: float = Form(...),
    status: str = Form(...),
    description: str = Form(default=""),
    avatar1: UploadFile = File(None),
    avatar2: UploadFile = File(None),
    avatar3: UploadFile = File(None)
):
    db: Session = SessionLocal()
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == id).first()
    if not slot:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该车位"})
    slot.slot_number = slot_number
    slot.name = name
    slot.type_id = type_id
    slot.location = location
    slot.charge_rule = charge_rule
    slot.price_per_hour = price_per_hour
    slot.status = status
    slot.description = description
    if avatar1:
        slot.avatar1 = save_avatar_file(avatar1)
    if avatar2:
        slot.avatar2 = save_avatar_file(avatar2)
    if avatar3:
        slot.avatar3 = save_avatar_file(avatar3)
    # slot.avatar1 = avatar1
    # slot.avatar2 = avatar2
    # slot.avatar3 = avatar3
    db.commit()
    db.close()
    return {"message": "修改成功"}

@router.delete("/api/reservation/slots/delete")
async def delete_parking_slot(id: int):
    db: Session = SessionLocal()
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == id).first()
    if not slot:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该车位"})
    db.delete(slot)
    db.commit()
    db.close()
    return {"message": "删除成功"}