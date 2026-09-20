from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.db.session import get_db
from app.models.entities import (
    JobApplication, Job, Employer, Student, StudentSkill, Skill,
    StudentCourse, Course, StudentResume, Message, User,
    StudentEducation, StudentCertificate, StudentLocation
)
from app.api.deps import get_current_user

router = APIRouter()

def get_employer(current_user: User, db: Session) -> Employer:
    if current_user.role != 'EMPLOYER':
        raise HTTPException(status_code=403, detail="Only employers can manage job applications")
    emp = db.query(Employer).filter(Employer.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employer profile not found")
    return emp

def _serialize_application(app: JobApplication, job: Job, emp: Employer, db: Session) -> dict:
    stu = db.query(Student).filter(Student.id == app.student_id).first()
    student_user_id = stu.user_id if stu else None

    # Retrieve student's verified skills
    student_skills = []
    if stu:
        s_skills = db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()
        for ss in s_skills:
            sk = db.query(Skill).filter(Skill.id == ss.skill_id).first()
            if sk:
                student_skills.append({
                    "id": sk.id,
                    "name": sk.name,
                    "domain": sk.domain,
                    "proficiency": ss.proficiency or "INTERMEDIATE"
                })

    # Retrieve student's completed courses
    completed_courses = []
    if stu:
        s_courses = db.query(StudentCourse).filter(StudentCourse.student_id == stu.id).all()
        for sc in s_courses:
            c = db.query(Course).filter(Course.id == sc.course_id).first()
            if c:
                completed_courses.append({
                    "id": c.id,
                    "title": c.title,
                    "domain": c.domain,
                    "grade": sc.grade
                })

    # Retrieve student's formal education history
    education_history = []
    if stu:
        edus = db.query(StudentEducation).filter(StudentEducation.student_id == stu.id).all()
        for e in edus:
            education_history.append({
                "degree": e.degree,
                "field_of_study": e.field_of_study,
                "institution": e.institution,
                "graduation_year": e.graduation_year
            })

    # Retrieve student's certificates
    certificates = []
    if stu:
        certs = db.query(StudentCertificate).filter(StudentCertificate.student_id == stu.id).all()
        for cr in certs:
            certificates.append({
                "title": cr.title,
                "issuer": cr.issuer,
                "issue_date": cr.issue_date,
                "credential_id": cr.credential_id,
                "credential_url": cr.credential_url,
                "gained_skills": cr.gained_skills
            })

    # Retrieve full student resume if uploaded or parsed
    resume_text = None
    if stu:
        res = db.query(StudentResume).filter(StudentResume.student_id == stu.id).first()
        if res and res.raw_text:
            resume_text = res.raw_text

    return {
        "id": app.id,
        "job_id": app.job_id,
        "job_title": job.title,
        "job_sector": job.sector,
        "job_type": job.job_type,
        "job_city": job.city,
        "student_id": app.student_id,
        "student_user_id": student_user_id,
        "full_name": app.full_name,
        "email": app.email,
        "phone": app.phone,
        "education": app.education,
        "city": app.city,
        "cover_letter": app.cover_letter,
        "status": app.status,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "employer_note": app.employer_note,
        "skills": student_skills,
        "completed_courses": completed_courses,
        "education_history": education_history,
        "certificates": certificates,
        "resume_text": resume_text,
        "linkedin_url": app.linkedin_url or (stu.linkedin_url if stu else None),
        "github_url": app.github_url or (stu.github_url if stu else None),
        "resume_attached": app.resume_attached,
    }

@router.get('/applications/employer')
def get_employer_applications(
    job_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all job applications submitted to jobs posted by the logged-in employer."""
    emp = get_employer(current_user, db)
    
    # Get all jobs posted by this employer
    query = db.query(Job).filter(Job.employer_id == emp.id)
    if job_id:
        query = query.filter(Job.id == job_id)
    jobs = query.all()
    job_map = {j.id: j for j in jobs}

    if not job_map:
        return []

    applications = db.query(JobApplication).filter(
        JobApplication.job_id.in_(list(job_map.keys()))
    ).order_by(desc(JobApplication.applied_at)).all()

    return [_serialize_application(a, job_map[a.job_id], emp, db) for a in applications]

@router.get('/applications/employer/{job_id}')
def get_job_applications(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all applications for a specific job posted by the employer."""
    emp = get_employer(current_user, db)
    job = db.query(Job).filter(Job.id == job_id, Job.employer_id == emp.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or does not belong to your company")

    applications = db.query(JobApplication).filter(
        JobApplication.job_id == job_id
    ).order_by(desc(JobApplication.applied_at)).all()

    return [_serialize_application(a, job, emp, db) for a in applications]

class ContactCandidateReq(BaseModel):
    subject: str
    body: str

@router.post('/applications/{app_id}/contact')
def contact_candidate(
    app_id: int,
    req: ContactCandidateReq,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Employer contacts candidate regarding next steps.
    Updates application status to CONTACTED and sends an inbox message to the student.
    """
    emp = get_employer(current_user, db)
    application = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id, Job.employer_id == emp.id).first()
    if not job:
        raise HTTPException(status_code=403, detail="You do not have permission to manage this application")

    stu = db.query(Student).filter(Student.id == application.student_id).first()
    if not stu or not stu.user_id:
        raise HTTPException(status_code=400, detail="Student account not found")

    # Update application status
    application.status = 'CONTACTED'
    application.employer_note = req.body

    # Send message to student inbox
    msg = Message(
        sender_user_id=current_user.id,
        recipient_user_id=stu.user_id,
        subject=req.subject or f"Next Steps: Application for {job.title} at {emp.company_name}",
        body=req.body,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(msg)
    db.commit()
    db.refresh(application)

    return {
        "success": True,
        "message": "Candidate contacted and message sent to student inbox",
        "application": _serialize_application(application, job, emp, db)
    }

class RejectCandidateReq(BaseModel):
    message: str

@router.post('/applications/{app_id}/reject')
def reject_candidate(
    app_id: int,
    req: RejectCandidateReq,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Employer rejects candidate and sends formal notification message with rationale to student inbox.
    """
    emp = get_employer(current_user, db)
    application = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id, Job.employer_id == emp.id).first()
    if not job:
        raise HTTPException(status_code=403, detail="You do not have permission to manage this application")

    stu = db.query(Student).filter(Student.id == application.student_id).first()
    if not stu or not stu.user_id:
        raise HTTPException(status_code=400, detail="Student account not found")

    # Update application status
    application.status = 'REJECTED'
    application.employer_note = req.message

    # Send notification message to student inbox
    msg = Message(
        sender_user_id=current_user.id,
        recipient_user_id=stu.user_id,
        subject=f"Update regarding your application for {job.title} at {emp.company_name}",
        body=req.message,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(msg)
    db.commit()
    db.refresh(application)

    return {
        "success": True,
        "message": "Candidate application marked as rejected and notification sent to student inbox",
        "application": _serialize_application(application, job, emp, db)
    }
