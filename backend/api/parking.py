# backend/api/parking.py
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")
router = APIRouter()

@router.get("/parkings", response_class=HTMLResponse, name="parking_page")
async def parking_page(request: Request):
    return templates.TemplateResponse("parkings.html", {"request": request})