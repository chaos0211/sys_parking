from fastapi import Request, APIRouter
from starlette.responses import RedirectResponse
from db import SessionLocal
from models.user import User
from starlette.templating import Jinja2Templates
import os
from config import TEMPLATES_DIR

templates = Jinja2Templates(directory=TEMPLATES_DIR)


router = APIRouter()

@router.get("/", name="home")
async def dashboard(request: Request):
    # user = None
    user_id = request.cookies.get("user_id")
    if user_id:
        db = SessionLocal()
        user = db.query(User).filter(User.id == int(user_id)).first()
        db.close()
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})