from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from db import SessionLocal
from models.reservation import ParkingSlotType
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