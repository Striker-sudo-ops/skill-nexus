import re

def resume_parse(raw_text: str, db) -> dict:
    from app.models.entities import Skill
    
    name = "Parsed Name"
    lines = raw_text.split('\n')
    for line in lines[:5]:
        if len(line.split()) in [2, 3] and line.istitle():
            name = line.strip()
            break

    db_skills = db.query(Skill).all()
    found_skills = []
    text_lower = raw_text.lower()
    for s in db_skills:
        if s.name.lower() in text_lower:
            found_skills.append(s.id)
            
    education = {"degree": "B.Tech", "field": "Unknown", "institution": "Unknown", "year": 2024}
    
    return {"name": name, "skills": found_skills, "education": education}

import math
def haversine(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2): return 0
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def recommend_jobs(student_id, db):
    from app.models.entities import StudentSkill, StudentLocation, Job, JobSkill, Employer, Skill
    student_skills = [s.skill_id for s in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()]
    loc = db.query(StudentLocation).filter(StudentLocation.student_id == student_id, StudentLocation.is_primary == True).first()
    slat = loc.latitude if loc else None
    slon = loc.longitude if loc else None
    
    jobs = db.query(Job).filter(Job.is_active == True).all()
    results = []
    for j in jobs:
        req_skills = db.query(JobSkill).filter(JobSkill.job_id == j.id).all()
        if not req_skills:
            continue
        req_skill_ids = [s.skill_id for s in req_skills]
        match_count = len(set(student_skills).intersection(set(req_skill_ids)))
        match_pct = (match_count / len(req_skill_ids)) * 100 if req_skill_ids else 0
        
        dist = 0
        if slat and slon and j.latitude and j.longitude:
            dist = haversine(slat, slon, j.latitude, j.longitude)
            
        emp = db.query(Employer).filter(Employer.id == j.employer_id).first()
        skill_names = []
        for rs in req_skills:
            sk = db.query(Skill).filter(Skill.id == rs.skill_id).first()
            if sk:
                skill_names.append({"id": sk.id, "name": sk.name, "is_required": rs.is_required})
                
        results.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "company_name": emp.company_name if emp else "Skill Nexus Partner",
            "city": j.city,
            "state": j.state,
            "job_type": j.job_type,
            "proficiency_required": j.proficiency_required,
            "experience_years": j.experience_years,
            "salary_min": j.salary_min or 500000,
            "salary_max": j.salary_max or 1000000,
            "openings_count": j.openings_count or 1,
            "sector": j.sector,
            "skill_match_pct": round(match_pct, 1),
            "distance_km": round(dist, 1),
            "required_skills": skill_names,
            "job": j
        })
        
    results.sort(key=lambda x: (-x['skill_match_pct'], x['distance_km']))
    return results[:10]
