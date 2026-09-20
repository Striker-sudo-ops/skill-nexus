import re
import math
import json
import logging
import requests
from typing import Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
#  1. Gemini LLM Workforce Synthesis Engine
# ─────────────────────────────────────────────────────────────────────────────

def call_gemini_api(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
    """
    Call Google Gemini Generative AI REST API using standard requests.
    Zero extra pip dependencies required. Works seamlessly on Render & Vercel.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        contents = []
        if system_instruction:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System Context: {system_instruction}\n\nTask: {prompt}"}]
            })
        else:
            contents.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800,
            }
        }

        try:
            r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=12)
            if r.status_code == 200:
                data = r.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            else:
                logger.warning(f"[Gemini API] Model {model} returned HTTP {r.status_code}: {r.text[:150]}")
        except Exception as e:
            logger.warning(f"[Gemini API] Error contacting model {model}: {e}")

    return None


def generate_ai_district_strategy(
    district: str,
    primary_sector: str,
    current_capacity: int,
    recommended_seats: int,
    shortage_deficit: int,
    top_skill: str,
    job_count: int,
    demand_index: float,
) -> Dict:
    """
    Generate an AI-driven workforce development strategy and action proposal.
    Uses Google Gemini if GEMINI_API_KEY is present, with an empirical statistical AI fallback.
    """
    is_deficit = shortage_deficit > 0
    status_label = "Deficit (Labor Shortage)" if is_deficit else ("Balanced Equilibrium" if shortage_deficit == 0 else "Surplus (Oversupply)")

    prompt = f"""
As a National Workforce & Skill Intelligence AI, analyze this district:
- District: {district}, Maharashtra
- Primary Industrial Trade: {primary_sector}
- Highest In-Demand Technical Skill: {top_skill}
- Sanctioned Training Capacity: {current_capacity:,} seats
- Recommended Target Demand: {recommended_seats:,} seats
- Net Skills Gap: {shortage_deficit:+,} ({status_label})
- Active Hiring Postings: {job_count}
- Demand Intensity Score: {demand_index}/100

Provide a structured, executive recommendation in strict JSON with keys:
"recommended_action": (concise 1-sentence action, max 20 words),
"ai_rationale": (2-3 sentences explaining the economic driver and skill pipeline transition),
"target_roles": [list of 3 specific modern job roles to train for],
"urgency": ("CRITICAL" | "HIGH" | "MODERATE" | "STABLE")
"""
    system_ctx = "You are the AI workforce analytics engine for the Ministry of Skill Development and State ITI training."
    gemini_response = call_gemini_api(prompt, system_instruction=system_ctx)

    if gemini_response:
        try:
            json_match = re.search(r"\{[\s\S]*\}", gemini_response)
            if json_match:
                parsed = json.loads(json_match.group(0))
                return {
                    "source": "Gemini AI (Live)",
                    "recommended_action": parsed.get("recommended_action", ""),
                    "ai_rationale": parsed.get("ai_rationale", ""),
                    "target_roles": parsed.get("target_roles", [f"{top_skill} Engineer", f"Industrial {primary_sector} Specialist", "Automation Technician"]),
                    "urgency": parsed.get("urgency", "HIGH" if is_deficit else "MODERATE"),
                }
        except Exception as e:
            logger.info(f"[AI Strategy] JSON parse notice: {e}")

    # Empirical Statistical Model Fallback (When API key is not configured or rate-limited)
    if is_deficit:
        action = f"Deficit of {abs(shortage_deficit):,} seats: Expand intake in {primary_sector} to meet hiring demand"
        rationale = f"Live employer hiring velocity outpaces current graduate output by {demand_index:.1f}%. Local industrial expansion requires rapid capacity expansion to eliminate labor shortages."
        urgency = "CRITICAL" if abs(shortage_deficit) > 3000 else "HIGH"
    elif shortage_deficit == 0:
        action = f"Market in balance: Maintain stable intake in {primary_sector}"
        rationale = f"District training throughput matches local industrial absorption. Focus should shift to quality improvement and faculty upskilling."
        urgency = "STABLE"
    else:
        surplus = abs(shortage_deficit)
        action = f"Surplus of {surplus:,} seats: Modernize curriculum in {primary_sector} toward high-demand trades"
        rationale = f"Current training capacity exceeds local hiring absorption by {surplus:,} seats. Transitioning curriculum prevents regional underemployment."
        urgency = "MODERATE"

    return {
        "source": "Predictive Workforce Engine",
        "recommended_action": action,
        "ai_rationale": rationale,
        "target_roles": [f"{top_skill} Specialist", f"Advanced {primary_sector} Technician", "Quality & Automation Engineer"],
        "urgency": urgency,
    }


def resume_parse(raw_text: str, db) -> dict:
    from app.models.entities import Skill
    
    name = "Candidate"
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
            
    education = {"degree": "Diploma / ITI", "field": "Technical", "institution": "Technical Institute", "year": 2024}
    
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
    from collections import defaultdict
    from app.models.entities import StudentSkill, StudentLocation, Job, JobSkill, Employer, Skill
    student_skills = set(s.skill_id for s in db.query(StudentSkill.skill_id).filter(StudentSkill.student_id == student_id).all())
    loc = db.query(StudentLocation).filter(StudentLocation.student_id == student_id, StudentLocation.is_primary == True).first()
    slat = loc.latitude if loc else None
    slon = loc.longitude if loc else None
    
    jobs = db.query(Job).filter(Job.is_active == True).all()
    if not jobs:
        return []

    job_ids = [j.id for j in jobs]
    emp_ids = [j.employer_id for j in jobs if j.employer_id]

    # Batch query all JobSkills for active jobs
    all_job_skills = db.query(JobSkill).filter(JobSkill.job_id.in_(job_ids)).all()
    skills_by_job = defaultdict(list)
    skill_ids_to_fetch = set()
    for js in all_job_skills:
        skills_by_job[js.job_id].append(js)
        skill_ids_to_fetch.add(js.skill_id)

    # Batch query all referenced Skills
    skills_map = {}
    if skill_ids_to_fetch:
        skills = db.query(Skill).filter(Skill.id.in_(skill_ids_to_fetch)).all()
        skills_map = {s.id: s for s in skills}

    # Batch query Employers
    employers_map = {}
    if emp_ids:
        employers = db.query(Employer).filter(Employer.id.in_(emp_ids)).all()
        employers_map = {e.id: e for e in employers}

    results = []
    for j in jobs:
        req_skills = skills_by_job.get(j.id, [])
        if not req_skills:
            continue
        req_skill_ids = [s.skill_id for s in req_skills]
        match_count = len(student_skills.intersection(req_skill_ids))
        match_pct = (match_count / len(req_skill_ids)) * 100 if req_skill_ids else 0
        
        dist = 0
        if slat and slon and j.latitude and j.longitude:
            dist = haversine(slat, slon, j.latitude, j.longitude)
            
        emp = employers_map.get(j.employer_id)
        skill_names = []
        for rs in req_skills:
            sk = skills_map.get(rs.skill_id)
            if sk:
                skill_names.append({"id": sk.id, "name": sk.name, "is_required": rs.is_required})
                
        results.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "company_name": j.company_name or (emp.company_name if emp else "Skill Nexus Partner"),
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
        })
        
    results.sort(key=lambda x: (-x['skill_match_pct'], x['distance_km']))
    return results[:10]
