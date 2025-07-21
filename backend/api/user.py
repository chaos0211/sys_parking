# backend/api/user.py

from fastapi import APIRouter, Request, Path, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from api.auth import get_current_user

# 注意这里路径要指向主目录下的 templates 文件夹
templates = Jinja2Templates(directory="templates")

from fastapi import UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from db import SessionLocal
from models.user import User
import hashlib, shutil, os
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/users", response_class=HTMLResponse, name="user_page")
async def users_page(request: Request, current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("users.html", {
        "request": request,
        "current_user": current_user  # ✅ 关键传参
    })

@router.get("/api/users")
async def get_users(page: int = 1, size: int = 10, role: str = None, current_user: User = Depends(get_current_user)):
    db: Session = SessionLocal()
    offset = (page - 1) * size
    query = db.query(User)
    if role:
        print("当前请求角色：", role)
        query = query.filter(User.role == role)
    total = query.count()  # 增加总数统计
    users = query.offset(offset).limit(size).all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "avatar1": user.avatar1,
            "avatar2": user.avatar2,
            "avatar3": user.avatar3,
            "gender": user.gender,
            "phone": user.phone,
            "plate": user.plate,
            "role": user.role,
        })
    db.close()
    return JSONResponse(content={"users": result, "total": total})

def save_avatar_file(file: UploadFile, upload_dir: str = "static/upload") -> str:
    content = file.file.read()
    ext = os.path.splitext(file.filename)[-1].lower()
    sha1_name = hashlib.sha1(content).hexdigest() + ext
    file_path = os.path.join(upload_dir, sha1_name)
    with open(file_path, "wb") as f:
        f.write(content)
    return hashlib.sha1(content).hexdigest()

@router.post("/api/users/add")
async def add_user(
    username: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    phone: str = Form(...),
    plate: str = Form(...),
    avatar1: UploadFile = File(None),
    avatar2: UploadFile = File(None),
    avatar3: UploadFile = File(None),
):
    db: Session = SessionLocal()
    user = User(
        username=username,
        password=password,
        name=name,
        gender=gender,
        phone=phone,
        plate=plate,
    )
    if avatar1:
        user.avatar1 = save_avatar_file(avatar1)
    if avatar2:
        user.avatar2 = save_avatar_file(avatar2)
    if avatar3:
        user.avatar3 = save_avatar_file(avatar3)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return {"message": "用户添加成功", "id": user.id}


# 新增：获取用户详情接口
@router.get("/api/users/{user_id}")
async def get_user_detail(user_id: int = Path(...)):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="用户未找到")
    result = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "avatar1": user.avatar1,
        "avatar2": user.avatar2,
        "avatar3": user.avatar3,
        "gender": user.gender,
        "phone": user.phone,
        "plate": user.plate,
        "role": user.role,
    }
    db.close()
    return result


# 新增：更新用户信息接口
@router.post("/api/users/{user_id}/update")
async def update_user(
    user_id: int = Path(...),
    username: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    phone: str = Form(...),
    plate: str = Form(...),
    avatar1: UploadFile = File(None),
    avatar2: UploadFile = File(None),
    avatar3: UploadFile = File(None),
):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="用户未找到")

    user.username = username
    user.name = name
    user.gender = gender
    user.phone = phone
    user.plate = plate
    if avatar1:
        user.avatar1 = save_avatar_file(avatar1)
    if avatar2:
        user.avatar2 = save_avatar_file(avatar2)
    if avatar3:
        user.avatar3 = save_avatar_file(avatar3)

    db.commit()
    db.close()
    return {"message": "用户信息已更新"}


# 新增：删除用户接口
@router.delete("/api/users/{user_id}/delete")
async def delete_user(user_id: int = Path(...)):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="用户未找到")
    db.delete(user)
    db.commit()
    db.close()
    return {"message": "用户已删除"}