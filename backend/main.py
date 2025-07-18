import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates

from api import home, user, parking, spaces, settings, help

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

# ✅ 正确注册资源路径
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

app.state.templates = templates

# ✅ 注册 API 路由
app.include_router(home.router)
app.include_router(user.router)
app.include_router(parking.router)
app.include_router(spaces.router)
app.include_router(settings.router)
app.include_router(help.router)