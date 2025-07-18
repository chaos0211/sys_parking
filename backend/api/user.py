# backend/api/user.py

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

# 注意这里路径要指向主目录下的 templates 文件夹
templates = Jinja2Templates(directory="templates")

router = APIRouter()

@router.get("/users", response_class=HTMLResponse, name="user_page")
async def user_page(request: Request):
    return templates.TemplateResponse("users.html", {"request": request})