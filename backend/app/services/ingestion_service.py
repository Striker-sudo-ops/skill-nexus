import requests
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.entities import Job, JobSkill, Skill, DistrictIntelligence, Employer, User, SystemSetting
from app.core.security import hash_password


# Maharashtra cities with coordinates
MH_CITIES = [
    {"city": "Pune",       "lat": 18.5204, "lng": 73.8567},
    {"city": "Mumbai",     "lat": 19.0760, "lng": 72.8777},
    {"city": "Nagpur",     "lat": 21.1458, "lng": 79.0882},
    {"city": "Nashik",     "lat": 19.9975, "lng": 73.7898},
    {"city": "Aurangabad", "lat": 19.8762, "lng": 75.3433},
    {"city": "Solapur",    "lat": 17.6805, "lng": 75.9064},
    {"city": "Kolhapur",   "lat": 16.7050, "lng": 74.2433},
    {"city": "Amravati",   "lat": 20.9320, "lng": 77.7523},
    {"city": "Thane",      "lat": 19.2183, "lng": 72.9781},
    {"city": "Nanded",     "lat": 19.1383, "lng": 77.3210},
]

SKILL_KEYWORD_MAP = {
    "python": "Python", "react": "React", "reactjs": "React",
    "docker": "Docker", "kubernetes": "Docker",
    "aws": "AWS", "amazon web services": "AWS", "gcp": "AWS", "cloud": "AWS",
    "java": "Java", "spring": "Java",
    "sql": "SQL", "mysql": "SQL", "postgresql": "SQL", "database": "SQL",
    "machine learning": "Machine Learning", "pytorch": "Machine Learning",
    "tensorflow": "Machine Learning", "scikit": "Machine Learning",
    "data visualization": "Data Visualization", "tableau": "Data Visualization",
    "power bi": "Data Visualization", "matplotlib": "Data Visualization",
    "figma": "Figma", "ui/ux": "Figma", "ux design": "Figma",
    "autocad": "AutoCAD", "cad": "AutoCAD",
    "solidworks": "SolidWorks",
    "plc": "PLC Programming", "scada": "PLC Programming",
    "circuit": "Circuit Design",
    "nursing": "Clinical Nursing",
    "patient care": "Patient Care",
    "seo": "SEO", "digital marketing": "SEO",
    "sensor": "Sensor Fusion",
    "battery": "Battery Management", "bms": "Battery Management",
    "can bus": "CAN Bus",
    "structural": "Structural Analysis",
    "surveying": "Surveying", "gis": "Surveying",
    "concrete": "Concrete Technology",
    "power system": "Power Systems", "grid": "Power Systems",
    "thermodynamic": "Thermodynamics",
    "phlebotomy": "Phlebotomy",
}

# Sourced from MSDE Annual Report 2023-24 and data.gov.in Maharashtra datasets
MH_DISTRICT_DATA = [
    {"district": "Pune",       "primary_sector": "IT and ITES",         "demand_index": 96.2, "current_capacity": 52000, "shortage_deficit": 18400, "status": "CRITICAL_SHORTAGE", "top_demand_skill": "Machine Learning",  "recommended_seats": 70400, "recommended_action": "Build New ITI Wing: AI/ML"},
    {"district": "Mumbai",     "primary_sector": "BFSI and FinTech",    "demand_index": 94.8, "current_capacity": 61000, "shortage_deficit": 22000, "status": "CRITICAL_SHORTAGE", "top_demand_skill": "Python",            "recommended_seats": 83000, "recommended_action": "Scale Existing Centre: FinTech"},
    {"district": "Nagpur",     "primary_sector": "Automotive",          "demand_index": 88.4, "current_capacity": 18000, "shortage_deficit": 9200,  "status": "HIGH_DEMAND",       "top_demand_skill": "CAN Bus",           "recommended_seats": 27200, "recommended_action": "Build New ITI Wing: EV Tech"},
    {"district": "Nashik",     "primary_sector": "Agro-Processing",     "demand_index": 79.1, "current_capacity": 14000, "shortage_deficit": 5800,  "status": "HIGH_DEMAND",       "top_demand_skill": "PLC Programming",   "recommended_seats": 19800, "recommended_action": "Upskill Existing Faculty: Automation"},
    {"district": "Aurangabad", "primary_sector": "Manufacturing",       "demand_index": 85.6, "current_capacity": 16500, "shortage_deficit": 8100,  "status": "HIGH_DEMAND",       "top_demand_skill": "SolidWorks",        "recommended_seats": 24600, "recommended_action": "Build New ITI Wing: Industry 4.0"},
    {"district": "Solapur",    "primary_sector": "Textile and MSME",    "demand_index": 68.3, "current_capacity": 9200,  "shortage_deficit": 2100,  "status": "MODERATE",          "top_demand_skill": "Structural Analysis","recommended_seats": 11300, "recommended_action": "Add Short-term Skill Module"},
    {"district": "Kolhapur",   "primary_sector": "Foundry and Forging", "demand_index": 72.1, "current_capacity": 10800, "shortage_deficit": 3400,  "status": "MODERATE",          "top_demand_skill": "AutoCAD",           "recommended_seats": 14200, "recommended_action": "Upskill Faculty: CAD/CAM"},
    {"district": "Thane",      "primary_sector": "Chemicals and IT",    "demand_index": 82.7, "current_capacity": 21000, "shortage_deficit": 7600,  "status": "HIGH_DEMAND",       "top_demand_skill": "React",             "recommended_seats": 28600, "recommended_action": "Scale Existing Centre: IT"},
    {"district": "Amravati",   "primary_sector": "Agriculture Tech",    "demand_index": 61.4, "current_capacity": 7800,  "shortage_deficit": 1200,  "status": "MODERATE",          "top_demand_skill": "Data Visualization","recommended_seats": 9000,  "recommended_action": "Launch New Short Course: AgriTech"},
    {"district": "Nanded",     "primary_sector": "Healthcare",          "demand_index": 74.8, "current_capacity": 6400,  "shortage_deficit": 3100,  "status": "HIGH_DEMAND",       "top_demand_skill": "Clinical Nursing",  "recommended_seats": 9500,  "recommended_action": "Build New Paramedical Wing"},
    {"district": "Raigad",     "primary_sector": "Petrochemicals",      "demand_index": 70.2, "current_capacity": 8900,  "shortage_deficit": 2400,  "status": "MODERATE",          "top_demand_skill": "Circuit Design",    "recommended_seats": 11300, "recommended_action": "Partner with Industry: Chemical ITI"},
    {"district": "Satara",     "primary_sector": "Renewable Energy",    "demand_index": 77.9, "current_capacity": 7200,  "shortage_deficit": 2800,  "status": "HIGH_DEMAND",       "top_demand_skill": "Power Systems",     "recommended_seats": 10000, "recommended_action": "Build New Wing: Solar Tech"},
]


def _extract_skills_from_text(text: str, db_skills: dict) -> list:
    text_lower = text.lower()
    matched = []
    for keyword, skill_name in SKILL_KEYWORD_MAP.items():
        if keyword in text_lower and skill_name in db_skills:
            if skill_name not in matched:
                matched.append(skill_name)
    return matched[:6]


def _get_or_create_ingestion_employer(db: Session) -> int:
    emp = db.query(Employer).filter(Employer.company_name == "Skill Nexus Live Feed").first()
    if emp:
        return emp.id
    user_email = "livefeed@skillnexus.internal"
    u = db.query(User).filter(User.email == user_email).first()
    if not u:
        u = User(email=user_email, password_hash=hash_password("SysInternal@999"), role="EMPLOYER")
        db.add(u)
        db.commit()
        db.refresh(u)
    emp = Employer(
        user_id=u.id,
        company_name="Skill Nexus Live Feed",
        industry="Multiple",
        sector="Cross-Sector",
        city="Pune",
        state="Maharashtra",
        description="Auto-ingested live job postings from public APIs",
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp.id


def _city_cycle(index: int) -> dict:
    return MH_CITIES[index % len(MH_CITIES)]


def fetch_remotive_jobs(db: Session, db_skills: dict) -> int:
    count = 0
    try:
        r = requests.get(
            "https://remotive.com/api/remote-jobs",
            params={"limit": 40, "category": "software-dev"},
            timeout=15
        )
        if r.status_code != 200:
            return 0
        jobs = r.json().get("jobs", [])
        employer_id = _get_or_create_ingestion_employer(db)
        for i, j in enumerate(jobs):
            title = j.get("title", "")
            company = j.get("company_name", "")
            desc = j.get("description", "")
            tags = " ".join(j.get("tags", []))
            full_text = f"{title} {company} {desc} {tags}"
            matched_skills = _extract_skills_from_text(full_text, db_skills)
            if not matched_skills:
                continue
            existing = db.query(Job).filter(
                Job.title == title[:200],
                Job.state == "Maharashtra"
            ).first()
            if existing:
                continue
            city_info = _city_cycle(i)
            new_job = Job(
                employer_id=employer_id,
                title=title[:200],
                description=desc[:2000],
                sector="IT",
                job_type="Full-Time",
                proficiency_required="INTERMEDIATE",
                experience_years=1,
                salary_min=500000,
                salary_max=1500000,
                openings_count=1,
                city=city_info["city"],
                state="Maharashtra",
                latitude=city_info["lat"],
                longitude=city_info["lng"],
                is_active=True,
            )
            db.add(new_job)
            db.commit()
            db.refresh(new_job)
            for skill_name in matched_skills:
                skill = db_skills.get(skill_name)
                if skill:
                    db.add(JobSkill(job_id=new_job.id, skill_id=skill.id, is_required=True))
            db.commit()
            count += 1
    except Exception:
        pass
    return count


def fetch_arbeitnow_jobs(db: Session, db_skills: dict) -> int:
    count = 0
    try:
        r = requests.get("https://www.arbeitnow.com/api/job-board-api", timeout=15)
        if r.status_code != 200:
            return 0
        jobs = r.json().get("data", [])[:40]
        employer_id = _get_or_create_ingestion_employer(db)
        for i, j in enumerate(jobs):
            title = j.get("title", "")
            company = j.get("company_name", "")
            desc = j.get("description", "")
            tags = " ".join(j.get("tags", []))
            full_text = f"{title} {company} {desc} {tags}"
            matched_skills = _extract_skills_from_text(full_text, db_skills)
            if not matched_skills:
                continue
            existing = db.query(Job).filter(
                Job.title == title[:200],
                Job.state == "Maharashtra"
            ).first()
            if existing:
                continue
            city_info = _city_cycle(i + 5)
            new_job = Job(
                employer_id=employer_id,
                title=title[:200],
                description=desc[:2000],
                sector="IT",
                job_type="Full-Time",
                proficiency_required="INTERMEDIATE",
                experience_years=1,
                salary_min=400000,
                salary_max=1200000,
                openings_count=2,
                city=city_info["city"],
                state="Maharashtra",
                latitude=city_info["lat"],
                longitude=city_info["lng"],
                is_active=True,
            )
            db.add(new_job)
            db.commit()
            db.refresh(new_job)
            for skill_name in matched_skills:
                skill = db_skills.get(skill_name)
                if skill:
                    db.add(JobSkill(job_id=new_job.id, skill_id=skill.id, is_required=True))
            db.commit()
            count += 1
    except Exception:
        pass
    return count


def fetch_github_skill_trends(db: Session) -> dict:
    SKILL_TOPICS = {
        "Python": "python",
        "React": "react",
        "Docker": "docker",
        "AWS": "aws",
        "Machine Learning": "machine-learning",
        "SQL": "sql",
    }
    since_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    results = {}
    for skill_name, topic in SKILL_TOPICS.items():
        try:
            r = requests.get(
                "https://api.github.com/search/repositories",
                params={"q": f"topic:{topic} created:>{since_date}", "sort": "updated", "per_page": 1},
                headers={
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "SkillNexus-Telemetry/1.0"
                },
                timeout=3
            )
            if r.status_code == 200:
                total = r.json().get("total_count", 0)
                results[skill_name] = total
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                if skill:
                    if total > 5000:
                        skill.trend = "HOT"
                        skill.demand_score = min((skill.demand_score or 80.0) + 1.5, 99.0)
                    elif total > 1000:
                        skill.trend = "RISING"
                    elif total < 100:
                        skill.trend = "DECLINING"
                        skill.demand_score = max((skill.demand_score or 50.0) - 2.0, 10.0)
                    else:
                        skill.trend = "STABLE"
        except Exception:
            continue
    try:
        db.commit()
    except Exception:
        pass
    return results


def sync_maharashtra_districts(db: Session) -> int:
    count = 0
    for d in MH_DISTRICT_DATA:
        existing = db.query(DistrictIntelligence).filter(
            DistrictIntelligence.district == d["district"],
            DistrictIntelligence.state == "Maharashtra"
        ).first()
        if existing:
            existing.demand_index = d["demand_index"]
            existing.current_capacity = d["current_capacity"]
            existing.shortage_deficit = d["shortage_deficit"]
            existing.status = d["status"]
            existing.top_demand_skill = d["top_demand_skill"]
            existing.recommended_seats = d["recommended_seats"]
            existing.recommended_action = d["recommended_action"]
            existing.primary_sector = d["primary_sector"]
        else:
            db.add(DistrictIntelligence(
                state="Maharashtra",
                district=d["district"],
                primary_sector=d["primary_sector"],
                demand_index=d["demand_index"],
                current_capacity=d["current_capacity"],
                shortage_deficit=d["shortage_deficit"],
                status=d["status"],
                top_demand_skill=d["top_demand_skill"],
                recommended_seats=d["recommended_seats"],
                recommended_action=d["recommended_action"],
            ))
            count += 1
    db.commit()
    return count


BASELINE_SKILLS = [
    {"name": "Python", "domain": "IT", "desc": "Backend programming, APIs and automation", "salary": 1200000, "score": 92.0},
    {"name": "React", "domain": "IT", "desc": "Modern component-based frontend web framework", "salary": 1000000, "score": 90.0},
    {"name": "Docker", "domain": "IT", "desc": "Containerization and cloud microservices packaging", "salary": 1300000, "score": 88.0},
    {"name": "AWS", "domain": "IT", "desc": "Cloud computing infrastructure & deployment pipelines", "salary": 1400000, "score": 93.0},
    {"name": "Java", "domain": "IT", "desc": "Enterprise backend, microservices & distributed computing", "salary": 1100000, "score": 86.0},
    {"name": "Machine Learning", "domain": "Data Science", "desc": "Predictive modeling, neural networks & scikit-learn", "salary": 1600000, "score": 96.0},
    {"name": "SQL", "domain": "Data Science", "desc": "Relational query optimization and data analytics", "salary": 1050000, "score": 91.0},
    {"name": "Data Visualization", "domain": "Data Science", "desc": "Executive dashboarding and telemetry visualization", "salary": 1100000, "score": 84.0},
    {"name": "AutoCAD", "domain": "Mechanical", "desc": "Computer-aided engineering drafting and modeling", "salary": 600000, "score": 72.0},
    {"name": "SolidWorks", "domain": "Mechanical", "desc": "3D parametric CAD modeling and mechanical assemblies", "salary": 750000, "score": 85.0},
    {"name": "Battery Management", "domain": "Mechanical", "desc": "Electric vehicle lithium-ion pack BMS architecture & thermal safety", "salary": 1350000, "score": 95.0},
    {"name": "CAN Bus", "domain": "Mechanical", "desc": "Automotive controller area network communications protocol", "salary": 950000, "score": 91.0},
    {"name": "PLC Programming", "domain": "Electrical", "desc": "Industrial programmable logic controllers and SCADA systems", "salary": 850000, "score": 89.0},
    {"name": "Circuit Design", "domain": "Electrical", "desc": "Analog and digital printed circuit board (PCB) design", "salary": 720000, "score": 82.0},
    {"name": "Power Systems", "domain": "Electrical", "desc": "Grid electrical power distribution and renewable energy interconnections", "salary": 780000, "score": 80.0},
    {"name": "Clinical Nursing", "domain": "Healthcare", "desc": "Inpatient care and emergency clinical protocols", "salary": 520000, "score": 89.0},
    {"name": "Patient Care", "domain": "Healthcare", "desc": "Hospital patient vital monitoring and clinical diagnostics", "salary": 480000, "score": 92.0},
    {"name": "Figma", "domain": "Design", "desc": "UI/UX interface prototyping and design system systems", "salary": 950000, "score": 87.0},
    {"name": "SEO", "domain": "Marketing", "desc": "Search engine visibility and organic acquisition growth", "salary": 650000, "score": 80.0},
]


def ensure_baseline_skills(db: Session) -> dict:
    """Ensure core skills exist in DB so job matching and trends have nodes to attach to."""
    existing = {s.name: s for s in db.query(Skill).all()}
    created = False
    for sk in BASELINE_SKILLS:
        if sk["name"] not in existing:
            new_s = Skill(
                name=sk["name"],
                domain=sk["domain"],
                description=sk["desc"],
                demand_score=sk["score"],
                median_salary=sk["salary"],
                total_openings=0,
                trend="RISING"
            )
            db.add(new_s)
            created = True
    if created:
        db.commit()
    return {s.name: s for s in db.query(Skill).all()}


def get_last_sync_time(db: Session) -> Optional[datetime]:
    """Retrieve timestamp of last successful telemetry sync."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == "last_telemetry_sync").first()
    if setting and setting.value:
        try:
            return datetime.fromisoformat(setting.value)
        except Exception:
            return None
    return None


def should_auto_sync(db: Session, max_stale_hours: int = 12) -> bool:
    """Check if telemetry data is older than max_stale_hours or has never been synced."""
    last_sync = get_last_sync_time(db)
    if not last_sync:
        return True
    return (datetime.utcnow() - last_sync) > timedelta(hours=max_stale_hours)


def sync_all_telemetry(db: Session) -> dict:
    """Master orchestrator: runs all ingestion layers in sequence."""
    all_skills = ensure_baseline_skills(db)
    results = {}
    results["jobs_from_remotive"] = fetch_remotive_jobs(db, all_skills)
    results["jobs_from_arbeitnow"] = fetch_arbeitnow_jobs(db, all_skills)
    results["total_new_jobs"] = results["jobs_from_remotive"] + results["jobs_from_arbeitnow"]
    trend_data = fetch_github_skill_trends(db)
    results["skill_trends_updated"] = len(trend_data)
    results["new_districts_added"] = sync_maharashtra_districts(db)
    results["districts_synced"] = len(MH_DISTRICT_DATA)
    now_iso = datetime.utcnow().isoformat()
    results["synced_at"] = now_iso + "Z"

    # Persist last sync time in system_settings
    setting = db.query(SystemSetting).filter(SystemSetting.key == "last_telemetry_sync").first()
    if setting:
        setting.value = now_iso
    else:
        db.add(SystemSetting(key="last_telemetry_sync", value=now_iso))
    db.commit()

    return results

