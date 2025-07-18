# backend/api/help.py

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")

router = APIRouter()

@router.get("/help", response_class=HTMLResponse, name="help_page")
async def help_page(request: Request):
    return templates.TemplateResponse("help.html", {"request": request})