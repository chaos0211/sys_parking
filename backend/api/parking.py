# backend/api/parking.py
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Form, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from db import SessionLocal
from models import User
from models.parkings import Parking
from middleware.user import get_current_user
import os
import hashlib

templates = Jinja2Templates(directory="templates")
router = APIRouter()

@router.get("/parkings", response_class=HTMLResponse, name="parking_page")
async def parking_page(request: Request,current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("parkings.html", {
        "request": request,
        "current_user": current_user  # 获取当前用户
    })


# Helper function to save uploaded cover file
UPLOAD_DIR = "static/upload"

def save_cover_file(file: UploadFile):
    if not file:
        return None
    content = file.file.read()
    sha1 = hashlib.sha1(content).hexdigest() + ".jpg"
    path = os.path.join(UPLOAD_DIR, sha1)
    with open(path, "wb") as f:
        f.write(content)
    return sha1


# API: List all parkings
@router.get("/api/parkings")
async def list_parkings(page: int = 1, limit: int = 10):
    db: Session = SessionLocal()
    total = db.query(Parking).count()
    data = db.query(Parking).order_by(Parking.id.desc()).offset((page - 1) * limit).limit(limit).all()
    db.close()
    return JSONResponse(content={
        "total": total,
        "items": [{
            "id": p.id,
            "name": p.name,
            "cover": p.cover,
            "floor": p.floor,
            "type": p.type,
            "slots": p.slots,
            "facilities": p.facilities,
            "charge": p.charge,
            "description": p.description,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat()
        } for p in data]
    })


# API: Add a parking
@router.post("/api/parkings/add")
async def add_parking(
    name: str = Form(...),
    floor: str = Form(...),
    type: str = Form(...),
    slots: int = Form(...),
    facilities: str = Form(...),
    charge: str = Form(...),
    description: str = Form(...),
    cover: UploadFile = File(None)
):
    db: Session = SessionLocal()
    parking = Parking(
        name=name,
        floor=floor,
        type=type,
        slots=slots,
        facilities=facilities,
        charge=charge,
        description=description
    )
    if cover:
        parking.cover = save_cover_file(cover)
    db.add(parking)
    db.commit()
    db.refresh(parking)
    db.close()
    return {"message": "添加成功", "id": parking.id}


# API: Get a parking by ID
@router.get("/api/parkings/{parking_id}")
async def get_parking(parking_id: int):
    db: Session = SessionLocal()
    parking = db.query(Parking).filter_by(id=parking_id).first()
    db.close()
    if not parking:
        return JSONResponse(status_code=404, content={"message": "未找到该停车场"})
    return {
        "id": parking.id,
        "name": parking.name,
        "cover": parking.cover,
        "floor": parking.floor,
        "type": parking.type,
        "slots": parking.slots,
        "facilities": parking.facilities,
        "charge": parking.charge,
        "description": parking.description,
        "created_at": parking.created_at.isoformat(),
        "updated_at": parking.updated_at.isoformat()
    }


# API: Edit a parking
@router.post("/api/parkings/edit/{parking_id}")
async def edit_parking(
    parking_id: int,
    name: str = Form(...),
    floor: str = Form(...),
    type: str = Form(...),
    slots: int = Form(...),
    facilities: str = Form(...),
    charge: str = Form(...),
    description: str = Form(...),
    cover: UploadFile = File(None)
):
    db: Session = SessionLocal()
    parking = db.query(Parking).filter_by(id=parking_id).first()
    if not parking:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该停车场"})
    parking.name = name
    parking.floor = floor
    parking.type = type
    parking.slots = slots
    parking.facilities = facilities
    parking.charge = charge
    parking.description = description
    if cover:
        parking.cover = save_cover_file(cover)
    db.commit()
    db.refresh(parking)
    db.close()
    return {"message": "修改成功", "id": parking.id}


# API: Delete a parking
@router.post("/api/parkings/delete/{parking_id}")
async def delete_parking(parking_id: int):
    db: Session = SessionLocal()
    parking = db.query(Parking).filter_by(id=parking_id).first()
    if not parking:
        db.close()
        return JSONResponse(status_code=404, content={"message": "未找到该停车场"})
    db.delete(parking)
    db.commit()
    db.close()
    return {"message": "删除成功"}