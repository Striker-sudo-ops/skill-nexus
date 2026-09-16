from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.entities import User, Student, Employer, Trainer
from app.core.security import hash_password, verify_password, create_token
from app.api.deps import get_current_user

router = APIRouter()

class RegisterReq(BaseModel):
    email: str
    password: str
    role: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None

class LoginReq(BaseModel):
    email: str
    password: str

class ChangePasswordReq(BaseModel):
    current_password: str
    new_password: str

@router.post('/register')
def register(req: RegisterReq, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role = req.role.upper()
    if role not in ['STUDENT', 'EMPLOYER', 'ADMIN', 'TRAINER']:
        role = 'STUDENT'

    user = User(email=clean_email, password_hash=hash_password(req.password), role=role)
    db.add(user)
    db.commit()

    display_name = req.full_name or req.company_name or clean_email.split('@')[0]

    if role == 'STUDENT':
        stu = Student(user_id=user.id, full_name=req.full_name or display_name, profile_complete_pct=20.0)
        db.add(stu)
    elif role == 'EMPLOYER':
        emp = Employer(user_id=user.id, company_name=req.company_name or display_name, industry="Technology", city="Pune", state="Maharashtra")
        db.add(emp)
    db.commit()

    token = create_token(user.id, user.role)
    return {
        "access_token": token,
        "user": {"id": user.id, "email": user.email, "role": user.role, "full_name": display_name}
    }

@router.post('/login')
def login(req: LoginReq, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    display_name = user.email.split('@')[0]
    if user.role == 'STUDENT':
        stu = db.query(Student).filter(Student.user_id == user.id).first()
        if stu and stu.full_name:
            display_name = stu.full_name
    elif user.role == 'EMPLOYER':
        emp = db.query(Employer).filter(Employer.user_id == user.id).first()
        if emp and emp.company_name:
            display_name = emp.company_name
    elif user.role == 'ADMIN':
        display_name = "Government Administrator"
    elif user.role == 'TRAINER':
        trainer = db.query(Trainer).filter(Trainer.user_id == user.id).first()
        if trainer and trainer.name:
            display_name = trainer.name

    token = create_token(user.id, user.role)
    return {
        "access_token": token,
        "user": {"id": user.id, "email": user.email, "role": user.role, "full_name": display_name}
    }

@router.get('/me')
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = None
    display_name = current_user.email.split('@')[0]

    if current_user.role == 'STUDENT':
        profile = db.query(Student).filter(Student.user_id == current_user.id).first()
        if profile and profile.full_name:
            display_name = profile.full_name
    elif current_user.role == 'EMPLOYER':
        profile = db.query(Employer).filter(Employer.user_id == current_user.id).first()
        if profile and profile.company_name:
            display_name = profile.company_name
    elif current_user.role == 'ADMIN':
        display_name = "Government Administrator"
    elif current_user.role == 'TRAINER':
        profile = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
        if profile and profile.name:
            display_name = profile.name

    return {
        "user": {"id": current_user.id, "email": current_user.email, "role": current_user.role, "full_name": display_name},
        "profile": profile
    }

@router.post('/change-password')
def change_password(req: ChangePasswordReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
