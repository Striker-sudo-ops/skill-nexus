from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.entities import User, Student, Employer
from app.core.security import hash_password

def seed(force_reseed=False):
    db = SessionLocal()
    try:
        # 1. Admin accounts
        if not db.query(User).filter(User.email == "admin@skillnexus.in").first():
            db.add(User(email="admin@skillnexus.in", password_hash=hash_password("Admin@123"), role="ADMIN"))
        if not db.query(User).filter(User.email == "admin@skillbridge.in").first():
            db.add(User(email="admin@skillbridge.in", password_hash=hash_password("Admin@123"), role="ADMIN"))

        # 2. Student demo account
        student_user = db.query(User).filter(User.email == "demo.student@skillnexus.in").first()
        if not student_user:
            student_user = User(email="demo.student@skillnexus.in", password_hash=hash_password("Demo@123"), role="STUDENT")
            db.add(student_user)
            db.commit()
            db.refresh(student_user)
            db.add(Student(user_id=student_user.id, full_name="Demo Student", profile_complete_pct=50.0))

        if not db.query(User).filter(User.email == "demo.student@skillbridge.in").first():
            db.add(User(email="demo.student@skillbridge.in", password_hash=hash_password("Demo@123"), role="STUDENT"))

        # 3. Employer demo account
        employer_user = db.query(User).filter(User.email == "demo.employer@skillnexus.in").first()
        if not employer_user:
            employer_user = User(email="demo.employer@skillnexus.in", password_hash=hash_password("Demo@123"), role="EMPLOYER")
            db.add(employer_user)
            db.commit()
            db.refresh(employer_user)
            db.add(Employer(user_id=employer_user.id, company_name="Skill Nexus Partner Employer", industry="Technology", sector="Information Technology"))

        if not db.query(User).filter(User.email == "demo.employer@skillbridge.in").first():
            db.add(User(email="demo.employer@skillbridge.in", password_hash=hash_password("Demo@123"), role="EMPLOYER"))

        # 4. Trainer demo account
        if not db.query(User).filter(User.email == "demo.trainer@skillnexus.in").first():
            db.add(User(email="demo.trainer@skillnexus.in", password_hash=hash_password("Trainer@123"), role="TRAINER"))

        db.commit()
        print("Demo accounts initialized.")
    except Exception as e:
        print(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
