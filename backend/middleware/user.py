from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from models.user import User
from db import SessionLocal
from sqlalchemy.orm import Session

class UserContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        user_id = request.cookies.get("user_id")
        request.state.user = None
        if user_id:
            db: Session = SessionLocal()
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                request.state.user = user
        response = await call_next(request)
        return response

# auth.py 或 middleware/user.py 中定义
def get_current_user(request: Request) -> User:
    user_id = request.cookies.get("user_id")
    if not user_id:
        return None
    db: Session = SessionLocal()
    user = db.query(User).filter_by(id=user_id).first()
    db.close()
    return user