# from utils.render import render_with_user
import os
import hashlib
from fastapi import APIRouter, Request, Form, UploadFile, File, Response, Cookie
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from db import SessionLocal
from models.user import User
from pathlib import Path
from datetime import timedelta, datetime

router = APIRouter()
templates = Jinja2Templates(directory="templates")
UPLOAD_DIR = Path("upload")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def sha1_path(file: UploadFile):
    ext = os.path.splitext(file.filename)[-1]
    sha1 = hashlib.sha1(file.filename.encode("utf-8")).hexdigest()
    return sha1 + ext

@router.get("/register")
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request, "error": None})

@router.post("/register")
async def register_user(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    name: str = Form(""),
    gender: str = Form("保密"),
    phone: str = Form(""),
    plate: str = Form(""),
    files: list[UploadFile] = File(default=[])
):
    if password != confirm_password:
        return templates.TemplateResponse("register.html", {"request": request, "error": "两次密码不一致"})

    db: Session = SessionLocal()
    if db.query(User).filter_by(username=username).first():
        return templates.TemplateResponse("register.html", {"request": request, "error": "用户名已存在"})

    # 保存头像图片（最多3张）
    avatar_paths = []
    for idx, file in enumerate(files[:3]):
        ext = os.path.splitext(file.filename)[-1].lower()
        if ext not in [".jpg", ".png"]:
            continue
        filename = sha1_path(file)
        path = UPLOAD_DIR / filename
        with open(path, "wb") as f:
            content = await file.read()
            f.write(content)
        # 只保存文件名的 SHA1 值部分（不含扩展名），用于后续拼接 static/upload 路径
        avatar_paths.append(filename.replace(ext, ""))

    user = User(
        username=username,
        password=password,
        name=name,
        avatar1=avatar_paths[0] if len(avatar_paths) > 0 else None,
        avatar2=avatar_paths[1] if len(avatar_paths) > 1 else None,
        avatar3=avatar_paths[2] if len(avatar_paths) > 2 else None,
        gender=gender,
        phone=phone,
        plate=plate,
        role="user"
    )
    db.add(user)
    db.commit()
    db.close()
    return RedirectResponse("/login", status_code=302)
@router.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "error": None})

@router.post("/login")
async def login_user(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...)
):
    db: Session = SessionLocal()
    user = db.query(User).filter_by(username=username, password=password).first()
    db.close()
    if user:
        resp = RedirectResponse("/", status_code=302)
        expire = datetime.utcnow() + timedelta(days=30)
        resp.set_cookie(
            key="user_id",
            value=str(user.id),
            httponly=True,
            expires=expire.strftime("%a, %d-%b-%Y %H:%M:%S GMT")
        )
        return resp
    else:
        return templates.TemplateResponse("login.html", {"request": request, "error": "用户名或密码错误"})

@router.get("/me")
def get_current_user(request: Request, user_id: str = Cookie(default=None)):
    if not user_id:
        return RedirectResponse("/login")
    db: Session = SessionLocal()
    user = db.query(User).filter_by(id=user_id).first()
    db.close()
    if not user:
        return RedirectResponse("/login")
    user_data = {
        "avatar1": user.avatar1,
        "role": user.role
    }
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user_data})
    # return render_with_user(request, "dashboard.html", {"user": user_data})

@router.get("/logout")
def logout(response: Response):
    resp = RedirectResponse("/login", status_code=302)
    resp.delete_cookie("user_id")
    return resp