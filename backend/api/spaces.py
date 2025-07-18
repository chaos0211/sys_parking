from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")

router = APIRouter()

@router.get("/spaces", response_class=HTMLResponse, name="space_page")
async def space_page(request: Request):
    return templates.TemplateResponse("spaces.html", {"request": request})