# backend/api/settings.py

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")

router = APIRouter()

@router.get("/settings", response_class=HTMLResponse, name="settings_page")
async def settings_page(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request})