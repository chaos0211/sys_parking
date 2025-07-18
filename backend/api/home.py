# backend/api/home.py

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import FastAPI

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    # 从 app.state 中安全读取 Jinja2Templates 实例
    templates: Jinja2Templates = request.app.state.templates
    return templates.TemplateResponse("dashboard.html", {"request": request})