from fastapi import Request, APIRouter, Depends
from starlette.responses import RedirectResponse
from db import SessionLocal
from models.user import User
from starlette.templating import Jinja2Templates
import os
from config import TEMPLATES_DIR
from middleware.user import get_current_user

templates = Jinja2Templates(directory=TEMPLATES_DIR)


router = APIRouter()

@router.get("/", name="home")
async def dashboard(
    request: Request,
    current_user: User = Depends(get_current_user)  # ✅ 注入用户
):
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "current_user": current_user  # ✅ 传入模板
    })