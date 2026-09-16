from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from app.db.session import get_db
from app.models.entities import QuizQuestion, QuizAttempt, Student, User
from app.api.deps import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter()

@router.get('/quiz/{skill_id}/questions')
def get_questions(skill_id: int, db: Session = Depends(get_db)):
    qs = db.query(QuizQuestion).filter(QuizQuestion.skill_id == skill_id).order_by(func.random()).limit(10).all()
    return [{"id": q.id, "question": q.question, "option_a": q.option_a, "option_b": q.option_b, "option_c": q.option_c, "option_d": q.option_d} for q in qs]

class AnswerItem(BaseModel):
    question_id: int
    chosen_option: str

class SubmitReq(BaseModel):
    answers: List[AnswerItem]

@router.post('/quiz/{skill_id}/submit')
def submit_quiz(skill_id: int, req: SubmitReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    score = 0
    results = []
    
    for ans in req.answers:
        q = db.query(QuizQuestion).filter(QuizQuestion.id == ans.question_id).first()
        is_correct = (q.correct_option == ans.chosen_option) if q else False
        if is_correct: score += 1
        results.append({
            "question_id": ans.question_id,
            "correct": is_correct,
            "correct_option": q.correct_option if q else None,
            "explanation": q.explanation if q else None
        })
        
    total = len(req.answers)
    passed = (score / total) >= 0.6 if total > 0 else False
    
    if stu:
        attempt = QuizAttempt(student_id=stu.id, skill_id=skill_id, score=score, total=total, passed=passed)
        db.add(attempt)
        db.commit()
        
    return {"score": score, "total": total, "passed": passed, "results": results}

@router.get('/quiz/attempts')
def get_attempts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    return db.query(QuizAttempt).filter(QuizAttempt.student_id == stu.id).all()
