import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates

from middleware.user import UserContextMiddleware
from db import engine, SessionLocal
from models.user import Base, User # 确保 User 模型被导入以创建表
from api import home, user, parking, spaces, settings, help, auth

# ✅ 使用“运行目录”作为根目录
BASE_DIR = os.getcwd()
# print("BASE_DIR的路径是", BASE_DIR)
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
# print("TEMPLATES_DIR的路径是", TEMPLATES_DIR)
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = FastAPI(title="智慧停车系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
# 插入初始管理员账号
db = SessionLocal()
if not db.query(User).filter_by(username="admin").first():
    db.add(User(username="admin", password="123456", role="admin"))
    db.commit()
db.close()

# ✅ 正确注册资源路径
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/upload", StaticFiles(directory=os.path.join(STATIC_DIR, "upload")), name="upload")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

app.state.templates = templates

# ✅ 注册 API 路由
app.include_router(home.router)
app.include_router(user.router)
app.include_router(parking.router)
app.include_router(spaces.router)
app.include_router(settings.router)
app.include_router(help.router)
app.include_router(auth.router)

# from fastapi.middleware import Middleware
# app = FastAPI(middleware=[Middleware(UserContextMiddleware)])