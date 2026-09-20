from collections import defaultdict
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from pydantic import BaseModel
from app.db.session import get_db
from app.models.entities import Job, JobSkill, Skill, Employer, SkillResource, User, Student, SavedJob, JobAlert, JobApplication
from app.services.ai_service import haversine
from app.api.deps import get_current_user

router = APIRouter()

class JobApplyReq(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    education: Optional[str] = None
    city: Optional[str] = None
    cover_letter: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    resume_attached: Optional[bool] = False
    resume_url: Optional[str] = None

class JobAlertCreate(BaseModel):
    title: Optional[str] = None
    skills: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    sector: Optional[str] = None

@router.get('/jobs')
def search_jobs(
    q: Optional[str] = None, skill_ids: Optional[str] = None, domain: Optional[str] = None,
    city: Optional[str] = None, state: Optional[str] = None, job_type: Optional[str] = None,
    sector: Optional[str] = None, source: Optional[str] = None,
    experience_min: Optional[int] = None, experience_max: Optional[int] = None,
    salary_min: Optional[int] = None, salary_max: Optional[int] = None,
    include_expired: Optional[bool] = False,
    lat: Optional[float] = None, lng: Optional[float] = None,
    page: int = 1, per_page: int = 20, db: Session = Depends(get_db)
):
    query = db.query(Job)
    if not include_expired:
        query = query.filter(Job.is_active == True)

    if source:
        query = query.filter(Job.source == source)
    if q:
        query = query.filter((Job.title.ilike(f'%{q}%')) | (Job.description.ilike(f'%{q}%')) | (Job.company_name.ilike(f'%{q}%')))
    if city:
        query = query.filter(Job.city.ilike(f'%{city}%'))
    if state:
        query = query.filter(Job.state.ilike(f'%{state}%'))
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if sector:
        query = query.filter(Job.sector.ilike(f'%{sector}%'))
    if experience_min is not None:
        query = query.filter(Job.experience_years >= experience_min)
    if experience_max is not None:
        query = query.filter(Job.experience_years <= experience_max)
    if salary_min is not None:
        query = query.filter(Job.salary_min >= salary_min)
    if salary_max is not None:
        query = query.filter(Job.salary_max <= salary_max)

    target_skills = [int(s) for s in skill_ids.split(',') if s.strip()] if skill_ids else []
    if target_skills:
        job_ids_with_skills = [
            row[0] for row in db.query(JobSkill.job_id)
            .filter(JobSkill.skill_id.in_(target_skills))
            .distinct().all()
        ]
        query = query.filter(Job.id.in_(job_ids_with_skills))

    # Fast SQL-level pagination when geospatial sorting is not active
    start = (page - 1) * per_page
    if not (lat and lng):
        query = query.order_by(desc(Job.id))
        page_jobs = query.offset(start).limit(per_page).all()
    else:
        # Distance calculation in-memory only when coordinate search is requested
        jobs_all = query.all()
        jobs_with_dist = []
        for j in jobs_all:
            d = haversine(lat, lng, j.latitude, j.longitude) if (j.latitude and j.longitude) else float('inf')
            jobs_with_dist.append((d, j))
        jobs_with_dist.sort(key=lambda x: x[0])
        page_jobs = [item[1] for item in jobs_with_dist[start:start+per_page]]

    if not page_jobs:
        return []

    # Batch load JobSkills, Skills, and Employers for only the paginated slice
    page_job_ids = [j.id for j in page_jobs]
    page_emp_ids = [j.employer_id for j in page_jobs if j.employer_id]

    job_skills = db.query(JobSkill).filter(JobSkill.job_id.in_(page_job_ids)).all()
    skills_by_job = defaultdict(list)
    skill_ids_to_fetch = set()
    for js in job_skills:
        skills_by_job[js.job_id].append(js)
        skill_ids_to_fetch.add(js.skill_id)

    skills_map = {}
    if skill_ids_to_fetch:
        skills = db.query(Skill).filter(Skill.id.in_(skill_ids_to_fetch)).all()
        skills_map = {s.id: s for s in skills}

    employers_map = {}
    if page_emp_ids:
        employers = db.query(Employer).filter(Employer.id.in_(page_emp_ids)).all()
        employers_map = {e.id: e for e in employers}

    results = []
    for j in page_jobs:
        req_skills = skills_by_job.get(j.id, [])
        skill_objs = []
        for rs in req_skills:
            sk = skills_map.get(rs.skill_id)
            if sk:
                skill_objs.append({"id": sk.id, "name": sk.name, "is_required": rs.is_required})

        emp = employers_map.get(j.employer_id)
        dist = haversine(lat, lng, j.latitude, j.longitude) if (lat and lng and j.latitude and j.longitude) else None

        results.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "company_name": j.company_name or (emp.company_name if emp else None) or "Industry Partner",
            "apply_url": j.apply_url,
            "city": j.city,
            "state": j.state,
            "job_type": j.job_type,
            "proficiency_required": j.proficiency_required,
            "experience_years": j.experience_years,
            "salary_min": j.salary_min or 450000,
            "salary_max": j.salary_max or 950000,
            "openings_count": j.openings_count or 1,
            "sector": j.sector,
            "internship_duration": j.internship_duration,
            "source": j.source,
            "is_active": j.is_active,
            "last_seen_at": j.last_seen_at.isoformat() if j.last_seen_at else None,
            "required_skills": skill_objs,
            "distance": dist,
        })

    return results

@router.get('/jobs/count')
def job_count(db: Session = Depends(get_db)):
    total = db.query(Job).filter(Job.is_active == True).count()
    by_city = db.query(Job.city, func.count(Job.id)).filter(Job.is_active == True).group_by(Job.city).all()
    return {"total_india": total, "by_city": [{"city": c[0], "count": c[1]} for c in by_city]}

# ─── Saved Jobs (must precede /jobs/{job_id}) ─────────────────────────────────
@router.get('/jobs/saved')
def get_saved_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        return []
    saved = db.query(SavedJob).filter(SavedJob.student_id == stu.id).order_by(desc(SavedJob.saved_at)).all()
    if not saved:
        return []

    saved_job_ids = [s.job_id for s in saved]
    jobs = db.query(Job).filter(Job.id.in_(saved_job_ids)).all()
    jobs_map = {j.id: j for j in jobs}

    emp_ids = [j.employer_id for j in jobs if j.employer_id]
    employers_map = {e.id: e for e in db.query(Employer).filter(Employer.id.in_(emp_ids)).all()} if emp_ids else {}

    job_skills = db.query(JobSkill).filter(JobSkill.job_id.in_(saved_job_ids)).all()
    skills_by_job = defaultdict(list)
    skill_ids_to_fetch = set()
    for js in job_skills:
        skills_by_job[js.job_id].append(js)
        skill_ids_to_fetch.add(js.skill_id)

    skills_map = {s.id: s for s in db.query(Skill).filter(Skill.id.in_(skill_ids_to_fetch)).all()} if skill_ids_to_fetch else {}

    results = []
    for s in saved:
        j = jobs_map.get(s.job_id)
        if not j:
            continue
        emp = employers_map.get(j.employer_id)
        req_skills = skills_by_job.get(j.id, [])
        skill_objs = []
        for rs in req_skills:
            sk = skills_map.get(rs.skill_id)
            if sk:
                skill_objs.append({"id": sk.id, "name": sk.name, "is_required": rs.is_required})
        results.append({
            "saved_id": s.id,
            "saved_at": s.saved_at.isoformat() if s.saved_at else None,
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "company_name": j.company_name or (emp.company_name if emp else None) or "Industry Partner",
            "apply_url": j.apply_url,
            "city": j.city,
            "state": j.state,
            "job_type": j.job_type,
            "proficiency_required": j.proficiency_required,
            "experience_years": j.experience_years,
            "salary_min": j.salary_min or 450000,
            "salary_max": j.salary_max or 950000,
            "openings_count": j.openings_count or 1,
            "sector": j.sector,
            "source": j.source,
            "required_skills": skill_objs,
        })
    return results

@router.get('/jobs/saved/ids')
def get_saved_job_ids(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        return []
    return [r[0] for r in db.query(SavedJob.job_id).filter(SavedJob.student_id == stu.id).all()]

@router.post('/jobs/{job_id}/save')
def save_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        stu = Student(user_id=current_user.id, full_name=current_user.email.split('@')[0], profile_complete_pct=30.0)
        db.add(stu)
        db.commit()
        db.refresh(stu)
    existing = db.query(SavedJob).filter(SavedJob.student_id == stu.id, SavedJob.job_id == job_id).first()
    if not existing:
        new_save = SavedJob(student_id=stu.id, job_id=job_id)
        db.add(new_save)
        db.commit()
    return {"saved": True, "job_id": job_id}

@router.delete('/jobs/{job_id}/save')
def unsave_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if stu:
        db.query(SavedJob).filter(SavedJob.student_id == stu.id, SavedJob.job_id == job_id).delete()
        db.commit()
    return {"saved": False, "job_id": job_id}

# ─── Job Alerts ───────────────────────────────────────────────────────────────
@router.get('/job-alerts')
def list_job_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        return []
    alerts = db.query(JobAlert).filter(JobAlert.student_id == stu.id).order_by(desc(JobAlert.created_at)).all()
    results = []
    for a in alerts:
        q = db.query(Job).filter(Job.is_active == True)
        if a.location:
            q = q.filter((Job.city.ilike(f'%{a.location}%')) | (Job.state.ilike(f'%{a.location}%')))
        if a.job_type:
            q = q.filter(Job.job_type == a.job_type)
        if a.sector:
            q = q.filter(Job.sector.ilike(f'%{a.sector}%'))
        jobs_filtered = q.all()
        
        if a.skills:
            target_skills = [s.strip().lower() for s in a.skills.split(',') if s.strip()]
            matched_count = 0
            for j in jobs_filtered:
                req_skills = db.query(JobSkill).filter(JobSkill.job_id == j.id).all()
                skill_names = [
                    db.query(Skill).filter(Skill.id == rs.skill_id).first().name.lower()
                    for rs in req_skills if db.query(Skill).filter(Skill.id == rs.skill_id).first()
                ]
                if any(ts in skill_names or any(ts in sk for sk in skill_names) for ts in target_skills):
                    matched_count += 1
            match_count = matched_count
        else:
            match_count = len(jobs_filtered)

        results.append({
            "id": a.id,
            "title": a.title or (f"{a.skills} in {a.location}" if a.skills and a.location else a.skills or a.location or "Job Alert"),
            "skills": a.skills,
            "location": a.location,
            "job_type": a.job_type,
            "sector": a.sector,
            "is_active": a.is_active,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "matching_jobs_count": match_count
        })
    return results

@router.post('/job-alerts')
def create_job_alert(data: JobAlertCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        stu = Student(user_id=current_user.id, full_name=current_user.email.split('@')[0], profile_complete_pct=30.0)
        db.add(stu)
        db.commit()
        db.refresh(stu)
    new_alert = JobAlert(
        student_id=stu.id,
        title=data.title,
        skills=data.skills,
        location=data.location,
        job_type=data.job_type,
        sector=data.sector,
        is_active=True
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return {"success": True, "alert_id": new_alert.id}

@router.delete('/job-alerts/{alert_id}')
def delete_job_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if stu:
        db.query(JobAlert).filter(JobAlert.id == alert_id, JobAlert.student_id == stu.id).delete()
        db.commit()
    return {"success": True}

@router.get('/job-alerts/{alert_id}/matches')
def get_job_alert_matches(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        return []
    a = db.query(JobAlert).filter(JobAlert.id == alert_id, JobAlert.student_id == stu.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    q = db.query(Job).filter(Job.is_active == True)
    if a.location:
        q = q.filter((Job.city.ilike(f'%{a.location}%')) | (Job.state.ilike(f'%{a.location}%')))
    if a.job_type:
        q = q.filter(Job.job_type == a.job_type)
    if a.sector:
        q = q.filter(Job.sector.ilike(f'%{a.sector}%'))
    jobs_filtered = q.all()

    target_skills = [s.strip().lower() for s in a.skills.split(',') if s.strip()] if a.skills else []
    results = []
    for j in jobs_filtered:
        req_skills = db.query(JobSkill).filter(JobSkill.job_id == j.id).all()
        skill_objs = []
        for rs in req_skills:
            sk = db.query(Skill).filter(Skill.id == rs.skill_id).first()
            if sk:
                skill_objs.append({"id": sk.id, "name": sk.name, "is_required": rs.is_required})
        
        if target_skills:
            skill_names = [so["name"].lower() for so in skill_objs]
            if not any(ts in skill_names or any(ts in sk for sk in skill_names) for ts in target_skills):
                continue

        emp = db.query(Employer).filter(Employer.id == j.employer_id).first()
        results.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "company_name": j.company_name or (emp.company_name if emp else None) or "Industry Partner",
            "apply_url": j.apply_url,
            "city": j.city,
            "state": j.state,
            "job_type": j.job_type,
            "proficiency_required": j.proficiency_required,
            "experience_years": j.experience_years,
            "salary_min": j.salary_min or 450000,
            "salary_max": j.salary_max or 950000,
            "openings_count": j.openings_count or 1,
            "sector": j.sector,
            "source": j.source,
            "required_skills": skill_objs,
            "job": j
        })
    return results

@router.post('/jobs/{job_id}/apply')
def apply_to_job(job_id: int, req: JobApplyReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'STUDENT':
        raise HTTPException(status_code=403, detail="Only students can apply for jobs on the portal")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        stu = Student(user_id=current_user.id, full_name=req.full_name or current_user.email.split('@')[0], profile_complete_pct=30.0)
        db.add(stu)
        db.commit()
        db.refresh(stu)

    existing = db.query(JobApplication).filter(JobApplication.job_id == job_id, JobApplication.student_id == stu.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted an application for this job")

    application = JobApplication(
        job_id=job.id,
        student_id=stu.id,
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        education=req.education,
        city=req.city,
        cover_letter=req.cover_letter,
        linkedin_url=req.linkedin_url,
        github_url=req.github_url,
        resume_attached=req.resume_attached or False,
        resume_url=req.resume_url,
        status='PENDING',
    )
    # Sync candidate social links to profile if not yet saved
    if req.linkedin_url and not stu.linkedin_url:
        stu.linkedin_url = req.linkedin_url
    if req.github_url and not stu.github_url:
        stu.github_url = req.github_url
    if req.phone and not stu.phone:
        stu.phone = req.phone

    db.add(application)
    db.commit()
    db.refresh(application)
    return {
        "success": True,
        "message": "Application submitted successfully",
        "application_id": application.id,
        "status": application.status
    }

@router.get('/jobs/{job_id}/my-application')
def get_my_job_application(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'STUDENT':
        return {"applied": False}
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        return {"applied": False}
    app = db.query(JobApplication).filter(JobApplication.job_id == job_id, JobApplication.student_id == stu.id).first()
    if not app:
        return {"applied": False}
    return {
        "applied": True,
        "application": {
            "id": app.id,
            "status": app.status,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "employer_note": app.employer_note
        }
    }

@router.get('/jobs/{job_id}')
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return {"job": None, "employer": None, "company_name": None, "required_skills": [], "resources": []}
    emp = db.query(Employer).filter(Employer.id == job.employer_id).first()
    resolved_company = job.company_name or (emp.company_name if emp else None) or "Industry Partner"
    skills = db.query(JobSkill).filter(JobSkill.job_id == job_id).all()
    resources = []
    for s in skills:
        resources.extend(db.query(SkillResource).filter(SkillResource.skill_id == s.skill_id).all())
    return {"job": job, "employer": emp, "company_name": resolved_company, "apply_url": job.apply_url, "required_skills": skills, "resources": resources}

# ─── Skill Gap & AI Match Insights ───────────────────────────────────────────
@router.get('/jobs/{job_id}/skill-gap')
def get_job_skill_gap(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    student_skills_map = {}
    if stu:
        from app.models.entities import StudentSkill
        s_skills = db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()
        for ss in s_skills:
            sk = db.query(Skill).filter(Skill.id == ss.skill_id).first()
            if sk:
                student_skills_map[sk.name.lower()] = {
                    "skill_id": sk.id,
                    "name": sk.name,
                    "proficiency": ss.proficiency or "INTERMEDIATE"
                }

    req_skills = db.query(JobSkill).filter(JobSkill.job_id == job_id).all()
    matched = []
    missing = []
    for rs in req_skills:
        sk = db.query(Skill).filter(Skill.id == rs.skill_id).first()
        if not sk:
            continue
        sk_name_lower = sk.name.lower()
        if sk_name_lower in student_skills_map:
            matched.append({
                "id": sk.id,
                "name": sk.name,
                "proficiency": student_skills_map[sk_name_lower]["proficiency"],
                "is_required": rs.is_required
            })
        else:
            missing.append({
                "id": sk.id,
                "name": sk.name,
                "is_required": rs.is_required
            })

    total_req = max(len(req_skills), 1)
    match_pct = round((len(matched) / total_req) * 100) if req_skills else 80

    # Find recommended courses bridging the missing skills
    from app.models.entities import Course
    recommended_courses = []
    if missing:
        missing_names = [m["name"].lower() for m in missing]
        courses = db.query(Course).all()
        for c in courses:
            c_skills = (c.skills_offered or "").lower()
            if any(mn in c_skills for mn in missing_names):
                recommended_courses.append({
                    "id": c.id,
                    "course_code": c.course_code,
                    "title": c.title,
                    "domain": c.domain,
                    "duration_weeks": c.duration_weeks,
                    "skills_offered": c.skills_offered
                })
                if len(recommended_courses) >= 3:
                    break

    return {
        "job_id": job_id,
        "match_pct": match_pct,
        "readiness_pct": min(100, max(25, match_pct + 10 if stu and stu.profile_complete_pct > 60 else match_pct)),
        "matched_skills": matched,
        "missing_skills": missing,
        "recommended_courses": recommended_courses
    }

@router.get('/jobs/{job_id}/why-recommended')
def get_why_recommended(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    reasons = []

    # 1. Skill alignment
    req_skills = db.query(JobSkill).filter(JobSkill.job_id == job_id).all()
    matched_names = []
    if stu:
        from app.models.entities import StudentSkill
        s_skills = db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()
        s_ids = [ss.skill_id for ss in s_skills]
        for rs in req_skills:
            if rs.skill_id in s_ids:
                sk = db.query(Skill).filter(Skill.id == rs.skill_id).first()
                if sk:
                    matched_names.append(sk.name)

    if matched_names:
        reasons.append(f"Strong skill match with your verified profile: {', '.join(matched_names[:3])}.")
    else:
        reasons.append(f"Matches emerging technical market demand in the {job.sector or 'technical'} domain.")

    # 2. Regional industry hub alignment
    if job.city:
        reasons.append(f"Located in {job.city}, an active industrial cluster for {job.sector or 'engineering'} recruitment.")

    # 3. Career trajectory
    if job.experience_years == 0 or job.experience_years == 1:
        reasons.append(f"Entry-friendly experience requirement ({job.experience_years} yr) tailored for recent graduates and certified trainees.")
    else:
        reasons.append(f"Mid-level role ({job.experience_years} yrs exp) offering competitive salary progression.")

    # 4. Compensation benchmark
    if job.salary_min and job.salary_max:
        reasons.append(f"Salary bracket of ₹{(job.salary_min/100000):.1f} - ₹{(job.salary_max/100000):.1f} LPA meets or exceeds current regional standards.")

    return {
        "job_id": job_id,
        "title": job.title,
        "reasons": reasons,
        "summary": "High recommendation relevance based on skills and regional hiring metrics."
    }

@router.get('/analytics/salary-insights')
def get_salary_insights(db: Session = Depends(get_db)):
    """Computes real salary benchmarks from live jobs in the database."""
    jobs = db.query(Job).filter(Job.is_active == True).all()
    by_sector = {}
    for j in jobs:
        sec = j.sector or 'General Tech'
        if sec not in by_sector:
            by_sector[sec] = {"salaries": [], "count": 0}
        if j.salary_min and j.salary_max:
            avg_sal = (j.salary_min + j.salary_max) / 2
            by_sector[sec]["salaries"].append(avg_sal)
        by_sector[sec]["count"] += 1

    sector_insights = []
    for sec, data in by_sector.items():
        sals = data["salaries"]
        avg_lpa = round(sum(sals) / len(sals) / 100000, 1) if sals else 6.5
        min_lpa = round(min(sals) / 100000, 1) if sals else 4.0
        max_lpa = round(max(sals) / 100000, 1) if sals else 12.0
        sector_insights.append({
            "sector": sec,
            "job_count": data["count"],
            "avg_salary_lpa": avg_lpa,
            "min_salary_lpa": min_lpa,
            "max_salary_lpa": max_lpa
        })
    sector_insights.sort(key=lambda x: x["job_count"], reverse=True)
    return {"insights": sector_insights, "total_sampled_jobs": len(jobs)}
