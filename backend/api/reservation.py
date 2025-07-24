import hashlib
import os

from sqlalchemy import case

from fastapi import APIRouter, Request, Form, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from db import SessionLocal
from models.reservation import ParkingSlotType, ParkingSlot, ParkingReservation, ParkingExit
from datetime import datetime
from sqlalchemy.orm import joinedload
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from models.user import User
from models.reservation import ParkingEntry
from middleware.user import get_current_user

templates = Jinja2Templates(directory="templates")

router = APIRouter()


status_map = {
        "reserving": "预约中",
        "entered": "已入场",
        "exited": "已离场"
    }

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


# 预约相关 API

@router.get("/api/reservation/reserve")
async def list_reservations(page: int = 1, page_size: int = 10):
    db: Session = SessionLocal()

    query = db.query(ParkingReservation).options(
        joinedload(ParkingReservation.slot).joinedload(ParkingSlot.type),
        joinedload(ParkingReservation.slot).joinedload(ParkingSlot.parking)
    )
    total = query.count()
    reservations = query.order_by(ParkingReservation.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    db.close()


    return JSONResponse(content={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": r.id,
                "slot_id": r.slot_id,
                "slot_number": r.slot.slot_number if r.slot else "",
                "slot_name": r.slot.name if r.slot else "",
                "slot_type": r.slot.type.type_name if r.slot and r.slot.type else "",
                "parking_name": r.slot.parking.name if r.slot and r.slot.parking else "",
                "license_plate": r.license_plate,
                "reserved_at": r.reserved_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
                "status": status_map.get(r.status, r.status)
            }
            for r in reservations
        ]
    })


@router.post("/api/reservation/reserve/add")
async def add_reservation(request: Request):
    data = await request.json()
    slot_id = data.get("slot_id")
    license_plate = data.get("license_plate")
    reservation_time = data.get("reserved_at")
    db: Session = SessionLocal()

    # 非空校验
    if not reservation_time:
        db.close()
        return JSONResponse(status_code=400, content={"message": "预约时间不能为空"})

    # 仅允许选择 status 为 "free" 的车位
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id, ParkingSlot.status == "free").first()
    if not slot:
        db.close()
        return JSONResponse(status_code=400, content={"message": "无效的车位编号或车位已被占用"})

    reservation = ParkingReservation(
        slot_id=slot_id,
        license_plate=license_plate,
        reserved_at=datetime.fromisoformat(str(reservation_time)) if reservation_time else datetime.utcnow(),
        created_at=datetime.utcnow(),
        status="reserving"
    )
    db.add(reservation)
    slot.status = "occupy"
    db.commit()
    db.refresh(reservation)
    db.close()
    return {"message": "预约成功", "id": reservation.id}



@router.put("/api/reservation/reserve/edit/{id}")
async def edit_reservation(
    id: int,
    request: Request
):
    db: Session = SessionLocal()
    reservation = db.query(ParkingReservation).filter(ParkingReservation.id == id).first()
    if not reservation:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该预约记录"})

    data = await request.json()
    slot_id = data.get("slot_id")
    reserved_at = data.get("reserved_at")
    # Ensure reserved_at is a string and not a dict/list
    if isinstance(reserved_at, (dict, list)):
        db.close()
        return JSONResponse(status_code=400, content={"message": "预约时间格式错误"})
    if not isinstance(reserved_at, str):
        reserved_at = str(reserved_at)
    print("reservation的值为：", reservation)
    print("reserved_at的值为：", reserved_at)
    if reserved_at:
        reservation.reserved_at = datetime.fromisoformat(str(reserved_at))
    reservation.updated_at = datetime.utcnow()

    if str(reservation.slot_id) != str(slot_id):
        old_slot = db.query(ParkingSlot).filter(ParkingSlot.id == reservation.slot_id).first()
        new_slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id, ParkingSlot.status == "free").first()
        if not new_slot:
            db.close()
            return JSONResponse(status_code=400, content={"message": "目标车位无效或不可用"})
        if old_slot:
            old_slot.status = "free"
        new_slot.status = "occupy"
        reservation.slot_id = slot_id

    db.commit()
    db.close()
    return {"message": "修改成功"}


@router.get("/api/reservation/reserve/detail")
async def get_reservation_detail(id: int):
    db: Session = SessionLocal()
    r = db.query(ParkingReservation).options(joinedload(ParkingReservation.slot)).filter(ParkingReservation.id == id).first()
    if not r:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该预约记录"})

    result = {
        "id": r.id,
        "slot_id": r.slot_id,
        "slot_number": r.slot.slot_number if r.slot else "",
        "slot_name": r.slot.name if r.slot else "",
        "slot_type": r.slot.type.type_name if r.slot and r.slot.type else "",
        "parking_name": r.slot.parking.name if r.slot and r.slot.parking else "",
        "license_plate": r.license_plate,
        "reserved_at": r.reserved_at.isoformat(),
        "updated_at": r.updated_at.isoformat(),
        # "status": r.status,
        "status": status_map.get(r.status, r.status),
        "avatar1": r.slot.avatar1 if r.slot else "",
        "avatar2": r.slot.avatar2 if r.slot else "",
        "avatar3": r.slot.avatar3 if r.slot else "",
    }
    db.close()
    return result


@router.delete("/api/reservation/reserve/delete")
async def delete_reservation(id: int):
    db: Session = SessionLocal()
    r = db.query(ParkingReservation).filter(ParkingReservation.id == id).first()
    if not r:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该预约记录"})
    db.delete(r)
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


@router.get("/api/reservation/entry")
async def list_parking_entries(page: int = 1, page_size: int = 10):
    db: Session = SessionLocal()
    from models.reservation import ParkingSlot  # for joinedload
    query = db.query(ParkingEntry).options(
        joinedload(ParkingEntry.slot).joinedload(ParkingSlot.parking),
        joinedload(ParkingEntry.user)
    )
    total = query.count()
    review_order = case(
        (ParkingEntry.review_status == "pending", 0),
        (ParkingEntry.review_status.in_(["approved", "rejected"]), 1),
        else_=2
    )
    entries = query.order_by(review_order, ParkingEntry.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

    status_map = {"not_exited": "未离场", "exited": "已离场"}
    review_map = {"pending": "未审核", "approved": "通过", "rejected": "拒绝"}

    results = []
    for i, e in enumerate(entries, start=1):
        results.append({
            "id": e.id,
            "index": i + (page - 1) * page_size,
            "slot_number": e.slot.slot_number if e.slot else "",
            "slot_name": e.slot.name if e.slot else "",
            "parking_name": e.slot.parking.name if e.slot and e.slot.parking else "",
            "price_per_hour": e.slot.price_per_hour if e.slot else "",
            "username": e.user.username if e.user else "",
            "license_plate": e.user.plate if e.user else "",
            "entry_time": e.entry_time.isoformat() if e.entry_time else "",
            "exit_status": status_map.get(e.exit_status, e.exit_status),
            "review_status": review_map.get(e.review_status, e.review_status),
            "review_reply": e.review_reply or ""
        })

    db.close()
    return JSONResponse(content={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": results
    })


@router.get("/api/reservation/entry/detail")
async def get_parking_entry_detail(id: int):
    db: Session = SessionLocal()
    from models.reservation import ParkingSlot  # for joinedload
    entry = db.query(ParkingEntry).options(
        joinedload(ParkingEntry.slot).joinedload(ParkingSlot.parking),
        joinedload(ParkingEntry.user)
    ).filter(ParkingEntry.id == id).first()
    if not entry:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该入场记录"})

    result = {
        "id": entry.id,
        "slot_number": entry.slot.slot_number if entry.slot else "",
        "slot_name": entry.slot.name if entry.slot else "",
        "parking_name": entry.slot.parking.name if entry.slot and entry.slot.parking else "",
        "price_per_hour": entry.slot.price_per_hour if entry.slot else "",
        "username": entry.user.username if entry.user else "",
        "license_plate": entry.user.plate if entry.user else "",
        "entry_time": entry.entry_time.isoformat() if entry.entry_time else "",
        "exit_status": entry.exit_status,
        "review_status": entry.review_status,
        "review_reply": entry.review_reply,
        "created_at": entry.created_at,
    }
    db.close()
    return result


@router.post("/api/reservation/entry/review")
async def review_entry(id: int = Form(...), review_status: str = Form(...), review_reply: str = Form(default="")):
    db: Session = SessionLocal()
    entry = db.query(ParkingEntry).filter(ParkingEntry.id == id).first()
    if not entry:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该入场记录"})

    if review_status not in ["approved", "rejected"]:
        db.close()
        return JSONResponse(status_code=400, content={"message": "无效的审核状态"})

    entry.review_status = review_status
    entry.review_reply = review_reply
    db.commit()
    db.refresh(entry)
    db.close()
    return {"message": "审核完成", "id": entry.id}


from math import ceil
from datetime import timedelta

@router.get("/api/reservation/exits/init")
def init_exits():
    db: Session = SessionLocal()
    reviewed_entries = db.query(ParkingEntry).filter(
        ParkingEntry.review_status == "approved"
    ).all()

    for entry in reviewed_entries:
        now = datetime.utcnow() + timedelta(hours=8)
        entry_time = entry.entry_time
        duration_hours = ceil((now - entry_time).total_seconds() / 3600)
        duration_hours = max(duration_hours, 1)

        exit_record = db.query(ParkingExit).filter(ParkingExit.entry_id == entry.id).first()
        if exit_record and exit_record.payment_status == "unpaid":
            exit_record.duration = duration_hours
        elif not exit_record:
            exit_record = ParkingExit(entry_id=entry.id, payment_status="unpaid", duration=duration_hours)
            db.add(exit_record)

    db.commit()
    db.close()
    return {"message": "同步成功"}


from datetime import datetime

@router.get("/api/reservation/exits")
def list_exits(page: int = 1, page_size: int = 10):
    db: Session = SessionLocal()

    query = db.query(ParkingExit).options(
        joinedload(ParkingExit.entry).joinedload(ParkingEntry.slot).joinedload(ParkingSlot.parking),
        joinedload(ParkingExit.entry).joinedload(ParkingEntry.user)
    )

    total = query.count()
    exits = query.order_by(ParkingExit.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # 支付状态映射
    payment_status_map = {
        "paid": "已支付",
        "unpaid": "未支付"
    }

    from datetime import timedelta
    result = []
    for idx, ex in enumerate(exits, start=(page - 1) * page_size + 1):
        entry = ex.entry
        slot = entry.slot
        now = datetime.utcnow() + timedelta(hours=8)
        # ✅ 动态计算停车时长
        # if entry.exit_status == "exited":
        #     duration = entry.duration or 0
        #     exit_time = entry.exit_time.isoformat() if entry.exit_time else ""
        # else:
        #     duration = int((now - entry.entry_time).total_seconds() / 3600)
        #     exit_time = ""
        fee = round(ex.duration * slot.price_per_hour, 2) if slot else 0

        result.append({
            "id": ex.id,
            "entry_id": entry.id,
            "index": idx,
            "slot_number": slot.slot_number if slot else "",
            "slot_name": slot.name if slot else "",
            "parking_name": slot.parking.name if slot and slot.parking else "",
            "entry_time": entry.entry_time.isoformat() if entry.entry_time else "",
            "exit_time": ex.exit_time.isoformat() if ex.exit_time else "",
            "duration": ex.duration,
            "price_per_hour": slot.price_per_hour if slot else 0,
            "fee": fee,
            "username": entry.user.username if entry.user else "",
            "license_plate": entry.user.plate if entry.user else "",
            "payment_status": payment_status_map.get(ex.payment_status, ex.payment_status)
        })

    db.close()
    return JSONResponse(content={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result
    })

@router.post("/api/reservation/exits/pay")
async def mark_paid(entry_id: int = Form(...)):
    db: Session = SessionLocal()
    entry = db.query(ParkingEntry).filter(ParkingEntry.id == entry_id).first()
    exit_record = db.query(ParkingExit).filter(ParkingExit.entry_id == entry_id).first()

    if not entry or not exit_record:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到记录"})

    # 更新 entry 表状态
    from datetime import timedelta
    now = datetime.utcnow() + timedelta(hours=8)
    entry.exit_status = "exited"
    exit_record.exit_time = now
    # entry.duration = round((now - entry.entry_time).total_seconds() / 3600, 2)

    # 更新 slot 状态
    if entry.slot:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == entry.slot_id).first()
        if slot:
            slot.status = "free"

    # 更新 exit 表支付状态
    exit_record.payment_status = "paid"
    db.commit()
    db.close()
    return {"message": "支付完成"}