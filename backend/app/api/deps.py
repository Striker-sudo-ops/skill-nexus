from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import User
from app.core.security import decode_token

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Not authenticated')
    token = authorization.split(' ')[1]
    try:
        payload = decode_token(token)
        user_id = int(payload['sub'])
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid token')
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user

def get_optional_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.split(' ')[1]
        payload = decode_token(token)
        user_id = int(payload['sub'])
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None
