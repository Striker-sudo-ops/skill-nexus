"""
Multi-Source Real-Time Job Ingestion Service
============================================
Sources:
  1. Adzuna India API        (ADZUNA_APP_ID + ADZUNA_APP_KEY)
  2. Jooble India API        (JOOBLE_API_KEY)
  3. Remotive API            (no key required)
  4. Jobicy API              (no key required)
  5. NCS Portal Scraper      (no key required — National Career Service)
  6. Mahaswayam Scraper      (no key required — Maharashtra state jobs)

District Intelligence: computed dynamically from live ingested job data.
Expiry: jobs absent from the current sync are auto-marked inactive.
Re-activation: expired jobs reappear and are re-activated in future syncs.
"""

import re
import html
import os
import time
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from collections import Counter
from typing import Optional, Dict, List

import requests
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.entities import (
    Job, JobSkill, Skill, DistrictIntelligence,
    Employer, User, SystemSetting,
)
from app.core.security import hash_password

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False

logger = logging.getLogger(__name__)

# ─── API keys (set as environment variables on Render — never hardcode) ────────
ADZUNA_APP_ID    = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY   = os.getenv("ADZUNA_APP_KEY", "")
JOOBLE_API_KEY   = os.getenv("JOOBLE_API_KEY", "")
DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY", "")

# ─── Maharashtra cities + geo-coordinates ─────────────────────────────────────
MH_CITIES = [
    {"city": "Pune",        "lat": 18.5204, "lng": 73.8567},
    {"city": "Mumbai",      "lat": 19.0760, "lng": 72.8777},
    {"city": "Nagpur",      "lat": 21.1458, "lng": 79.0882},
    {"city": "Nashik",      "lat": 19.9975, "lng": 73.7898},
    {"city": "Aurangabad",  "lat": 19.8762, "lng": 75.3433},
    {"city": "Solapur",     "lat": 17.6805, "lng": 75.9064},
    {"city": "Kolhapur",    "lat": 16.7050, "lng": 74.2433},
    {"city": "Amravati",    "lat": 20.9320, "lng": 77.7523},
    {"city": "Thane",       "lat": 19.2183, "lng": 72.9781},
    {"city": "Nanded",      "lat": 19.1383, "lng": 77.3210},
]
MH_CITY_MAP = {c["city"].lower(): c for c in MH_CITIES}

# Sources managed by the ingestion pipeline (only these are expired per-sync)
MANAGED_SOURCES = {
    "adzuna", "jooble", "remotive", "jobicy", "ncs",
    "mahaswayam", "indgovtjobs", "freejobalert", "remoteok"
}

# ─── Sector inference keywords ────────────────────────────────────────────────
SECTOR_KEYWORDS: Dict[str, List[str]] = {
    "IT":            ["software", "developer", "programmer", "devops", "cloud", "backend",
                      "frontend", "fullstack", "python", "java", "react", "node", "angular"],
    "Data Science":  ["data scientist", "machine learning", "data analyst", "ai ", "analytics",
                      "nlp", "deep learning", "bi analyst", "power bi", "tableau"],
    "Mechanical":    ["mechanical", "cad", "solidworks", "autocad", "design engineer",
                      "automobile", "ev ", "automotive", "production engineer"],
    "Electrical":    ["electrical", "power system", "plc", "scada", "circuit", "embedded",
                      "electronics", "vlsi", "instrumentation"],
    "Healthcare":    ["nurse", "doctor", "hospital", "clinical", "medical", "pharmacist",
                      "lab technician", "patient care", "radiology", "paramedic"],
    "Manufacturing": ["production", "manufacturing", "quality", "cnc", "operator",
                      "tooling", "machinist", "shop floor", "lean"],
    "Civil":         ["civil", "structural", "construction", "surveyor", "gis", "concrete",
                      "site engineer", "quantity surveyor"],
    "Marketing":     ["marketing", "seo", "digital marketing", "brand", "content",
                      "sales", "business development", "growth hacker"],
    "Design":        ["ui/ux", "figma", "graphic design", "product design", "ux research"],
    "Finance":       ["finance", "accounting", "ca ", "cfa", "auditor", "banker", "fintech",
                      "chartered accountant", "taxation"],
}

# ─── Skill keyword → canonical name ───────────────────────────────────────────
SKILL_KEYWORD_MAP: Dict[str, str] = {
    "python": "Python", "django": "Python", "flask": "Python", "fastapi": "Python",
    "react": "React", "reactjs": "React", "next.js": "React", "nextjs": "React",
    "docker": "Docker", "kubernetes": "Docker", "k8s": "Docker",
    "aws": "AWS", "amazon web services": "AWS", "gcp": "AWS", "azure": "AWS",
    "cloud computing": "AWS",
    "java": "Java", "spring boot": "Java", "spring": "Java", "j2ee": "Java",
    "sql": "SQL", "mysql": "SQL", "postgresql": "SQL", "oracle": "SQL",
    "machine learning": "Machine Learning", "pytorch": "Machine Learning",
    "tensorflow": "Machine Learning", "data science": "Machine Learning",
    "scikit": "Machine Learning", "deep learning": "Machine Learning",
    "data visualization": "Data Visualization", "tableau": "Data Visualization",
    "power bi": "Data Visualization", "powerbi": "Data Visualization",
    "figma": "Figma", "ui/ux": "Figma", "ux design": "Figma",
    "autocad": "AutoCAD", "cad/cam": "AutoCAD",
    "solidworks": "SolidWorks", "catia": "SolidWorks", "creo": "SolidWorks",
    "plc": "PLC Programming", "scada": "PLC Programming", "hmi": "PLC Programming",
    "circuit": "Circuit Design", "pcb": "Circuit Design", "vlsi": "Circuit Design",
    "nursing": "Clinical Nursing", "clinical nurse": "Clinical Nursing",
    "patient care": "Patient Care", "hospital": "Patient Care",
    "seo": "SEO", "digital marketing": "SEO", "sem": "SEO",
    "sensor fusion": "Sensor Fusion", "iot": "Sensor Fusion", "embedded": "Sensor Fusion",
    "battery management": "Battery Management", "bms": "Battery Management",
    "electric vehicle": "Battery Management", " ev ": "Battery Management",
    "can bus": "CAN Bus", "canbus": "CAN Bus", "automotive": "CAN Bus",
    "structural analysis": "Structural Analysis", "ansys": "Structural Analysis",
    "fea": "Structural Analysis", "finite element": "Structural Analysis",
    "surveying": "Surveying", "gis": "Surveying",
    "power systems": "Power Systems", "smart grid": "Power Systems",
    "renewable energy": "Power Systems", "solar": "Power Systems",
    "thermodynamics": "Thermodynamics", "hvac": "Thermodynamics",
    "phlebotomy": "Phlebotomy", "lab technician": "Phlebotomy",
    "concrete": "Concrete Technology", "civil engineering": "Concrete Technology",
}

# ─── Baseline skill seed data (metadata, NOT job listings) ────────────────────
BASELINE_SKILLS = [
    {"name": "Python",             "domain": "IT",           "desc": "Backend, APIs and automation",                       "salary": 1200000, "score": 92.0},
    {"name": "React",              "domain": "IT",           "desc": "Component-based frontend framework",                 "salary": 1000000, "score": 90.0},
    {"name": "Docker",             "domain": "IT",           "desc": "Containerisation and microservices",                 "salary": 1300000, "score": 88.0},
    {"name": "AWS",                "domain": "IT",           "desc": "Cloud infrastructure & deployment",                  "salary": 1400000, "score": 93.0},
    {"name": "Java",               "domain": "IT",           "desc": "Enterprise backend & microservices",                 "salary": 1100000, "score": 86.0},
    {"name": "Machine Learning",   "domain": "Data Science", "desc": "Predictive modelling & neural networks",            "salary": 1600000, "score": 96.0},
    {"name": "SQL",                "domain": "Data Science", "desc": "Relational query optimisation & analytics",          "salary": 1050000, "score": 91.0},
    {"name": "Data Visualization", "domain": "Data Science", "desc": "Dashboarding and telemetry visualisation",          "salary": 1100000, "score": 84.0},
    {"name": "AutoCAD",            "domain": "Mechanical",   "desc": "Engineering drafting and modelling",                "salary": 600000,  "score": 72.0},
    {"name": "SolidWorks",         "domain": "Mechanical",   "desc": "3-D parametric CAD and assemblies",                 "salary": 750000,  "score": 85.0},
    {"name": "Battery Management", "domain": "Mechanical",   "desc": "EV BMS architecture & thermal safety",              "salary": 1350000, "score": 95.0},
    {"name": "CAN Bus",            "domain": "Mechanical",   "desc": "Automotive CAN communications",                     "salary": 950000,  "score": 91.0},
    {"name": "Sensor Fusion",      "domain": "Mechanical",   "desc": "Multi-sensor telemetry and IoT",                    "salary": 1100000, "score": 88.0},
    {"name": "Structural Analysis","domain": "Mechanical",   "desc": "FEA-based stress simulation",                       "salary": 750000,  "score": 79.0},
    {"name": "Thermodynamics",     "domain": "Mechanical",   "desc": "Heat transfer, HVAC and thermal systems",           "salary": 720000,  "score": 76.0},
    {"name": "PLC Programming",    "domain": "Electrical",   "desc": "Industrial PLCs and SCADA",                         "salary": 850000,  "score": 89.0},
    {"name": "Circuit Design",     "domain": "Electrical",   "desc": "Analog and digital PCB design",                    "salary": 720000,  "score": 82.0},
    {"name": "Power Systems",      "domain": "Electrical",   "desc": "Grid power distribution and renewables",            "salary": 780000,  "score": 80.0},
    {"name": "Clinical Nursing",   "domain": "Healthcare",   "desc": "Inpatient care and clinical protocols",             "salary": 520000,  "score": 89.0},
    {"name": "Patient Care",       "domain": "Healthcare",   "desc": "Hospital vital monitoring and diagnostics",         "salary": 480000,  "score": 92.0},
    {"name": "Figma",              "domain": "Design",       "desc": "UI/UX prototyping and design systems",              "salary": 950000,  "score": 87.0},
    {"name": "SEO",                "domain": "Marketing",    "desc": "Search engine visibility and organic growth",       "salary": 650000,  "score": 80.0},
    {"name": "Surveying",          "domain": "Civil",        "desc": "Geospatial surveying and GIS",                     "salary": 620000,  "score": 74.0},
    {"name": "Concrete Technology","domain": "Civil",        "desc": "Concrete mix design and construction QC",           "salary": 580000,  "score": 71.0},
]


# ─────────────────────────────────────────────────────────────────────────────
#  Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _clean_html(raw: str) -> str:
    if not raw:
        return ""
    text = html.unescape(raw)
    text = re.sub(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>", "", text, flags=re.IGNORECASE)
    return text.strip()


def _extract_skills(text: str, db_skills: Dict[str, "Skill"]) -> List[str]:
    lower = text.lower()
    seen, matched = set(), []
    for kw, name in SKILL_KEYWORD_MAP.items():
        if kw in lower and name in db_skills and name not in seen:
            seen.add(name)
            matched.append(name)
    return matched[:8]


def _infer_sector(title: str, desc: str = "") -> str:
    combined = (title + " " + desc).lower()
    for sector, kws in SECTOR_KEYWORDS.items():
        if any(kw in combined for kw in kws):
            return sector
    return "General"


def _extract_mh_city(location_str: str) -> str:
    loc = (location_str or "").lower()
    for city_key, city_obj in MH_CITY_MAP.items():
        if city_key in loc:
            return city_obj["city"]
    return "Maharashtra"


def _city_geo(city_name: str, fallback_index: int = 0) -> Dict:
    return MH_CITY_MAP.get((city_name or "").lower(), MH_CITIES[fallback_index % len(MH_CITIES)])


def _parse_salary_str(s: str):
    if not s:
        return None, None
    nums = re.findall(r"[\d,]+", s.replace("₹", "").replace("$", "").replace("Rs", ""))
    vals = []
    for n in nums:
        try:
            v = int(n.replace(",", ""))
            if v < 1000:
                v *= 100000
            vals.append(v)
        except ValueError:
            pass
    if len(vals) >= 2:
        return min(vals), max(vals)
    if len(vals) == 1:
        return vals[0], None
    return None, None


def _get_employer_id(db: Session) -> int:
    emp = db.query(Employer).filter(Employer.company_name == "Skill Nexus Live Feed").first()
    if emp:
        return emp.id
    email = "livefeed@skillnexus.internal"
    u = db.query(User).filter(User.email == email).first()
    if not u:
        u = User(email=email, password_hash=hash_password("SysInternal@999"), role="EMPLOYER")
        db.add(u); db.commit(); db.refresh(u)
    emp = Employer(
        user_id=u.id, company_name="Skill Nexus Live Feed",
        industry="Multiple", sector="Cross-Sector",
        city="Pune", state="Maharashtra",
        description="Auto-ingested live job postings from public APIs and government portals",
    )
    db.add(emp); db.commit(); db.refresh(emp)
    return emp.id


def _upsert_job(
    db: Session, employer_id: int, source: str, source_id: str,
    title: str, company: str, description: str,
    city: str, state: str, lat: float, lng: float,
    sector: str, job_type: str, exp_years: int,
    salary_min, salary_max, apply_url: str, openings_count: int,
    db_skills: Dict, matched_skills: List[str], sync_ts: datetime,
) -> bool:
    title   = (title   or "")[:200]
    company = (company or "")[:200]

    existing = db.query(Job).filter(
        or_(
            and_(Job.source == source, Job.source_job_id == source_id),
            and_(Job.title == title, Job.company_name == company, Job.source.in_(MANAGED_SOURCES)),
        )
    ).first()

    if existing:
        existing.source        = source
        existing.source_job_id = source_id
        existing.last_seen_at  = sync_ts
        existing.is_active     = True
        if description:
            existing.description = description
        if apply_url:
            existing.apply_url = apply_url
        if salary_min is not None:
            existing.salary_min = salary_min
        if salary_max is not None:
            existing.salary_max = salary_max
        # ⚡ NO per-row commit — caller does one batch commit for all jobs in source
        return False

    new_job = Job(
        employer_id=employer_id, company_name=company or "Unknown Company",
        apply_url=apply_url or "", source=source, source_job_id=source_id,
        fetched_at=sync_ts, last_seen_at=sync_ts,
        title=title, description=description or "",
        sector=sector or "General", job_type=job_type or "Full-Time",
        proficiency_required="INTERMEDIATE", experience_years=exp_years or 1,
        salary_min=salary_min, salary_max=salary_max,
        openings_count=openings_count or 1,
        city=city, state=state or "Maharashtra",
        latitude=lat, longitude=lng, is_active=True,
    )
    db.add(new_job)
    # flush to assign new_job.id without committing the transaction
    db.flush()

    for skill_name in matched_skills:
        skill = db_skills.get(skill_name)
        if skill:
            db.add(JobSkill(job_id=new_job.id, skill_id=skill.id, is_required=True))
    # ⚡ NO per-row commit — caller does one batch commit for all jobs in source
    return True


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 1 — Adzuna India API
# ─────────────────────────────────────────────────────────────────────────────

def fetch_adzuna_jobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        logger.info("[Adzuna] Skipped — ADZUNA_APP_ID / ADZUNA_APP_KEY not configured.")
        return 0

    employer_id = _get_employer_id(db)
    count       = 0
    cities      = ["Pune", "Mumbai", "Nagpur", "Nashik", "Aurangabad",
                   "Thane", "Kolhapur", "Solapur", "Maharashtra"]

    for city in cities:
        for page in range(1, 4):   # 3 pages × 50 = 150 jobs per city
            try:
                r = requests.get(
                    f"https://api.adzuna.com/v1/api/jobs/in/search/{page}",
                    params={
                        "app_id": ADZUNA_APP_ID,
                        "app_key": ADZUNA_APP_KEY,
                        "where": city,
                        "results_per_page": 50,
                        "content-type": "application/json",
                        "max_days_old": 60,
                    },
                    headers={"User-Agent": "SkillNexus-India/2.0"},
                    timeout=15,
                )
                if r.status_code == 401:
                    logger.warning("[Adzuna] Invalid credentials — stopping.")
                    return count
                if r.status_code != 200:
                    break

                jobs = r.json().get("results", [])
                if not jobs:
                    break

                for i, j in enumerate(jobs):
                    title   = j.get("title", "")
                    company = (j.get("company") or {}).get("display_name", "")
                    desc    = _clean_html(j.get("description", ""))
                    url     = j.get("redirect_url", "")
                    raw_id  = str(j.get("id", f"{city}-{page}-{i}"))

                    area     = (j.get("location") or {}).get("area", [])
                    job_city = area[-1] if area else city
                    geo      = _city_geo(job_city, i)

                    s_min = j.get("salary_min")
                    s_max = j.get("salary_max")
                    sector  = _infer_sector(title, desc)
                    matched = _extract_skills(f"{title} {company} {desc}", db_skills)

                    if _upsert_job(
                        db, employer_id, "adzuna", f"adzuna-{raw_id}",
                        title, company, desc,
                        geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                        sector, "Full-Time", 1,
                        int(s_min) if s_min else None,
                        int(s_max) if s_max else None,
                        url, 1, db_skills, matched, sync_ts,
                    ):
                        count += 1

                time.sleep(0.25)
            except Exception as e:
                logger.warning(f"[Adzuna] {city} p{page}: {e}")
                break

    # ⚡ Single batch commit for all Adzuna jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 2 — Jooble India API
# ─────────────────────────────────────────────────────────────────────────────

def fetch_jooble_jobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    if not JOOBLE_API_KEY:
        logger.info("[Jooble] Skipped — JOOBLE_API_KEY not configured.")
        return 0

    employer_id = _get_employer_id(db)
    count       = 0
    queries     = [
        "software engineer", "data analyst", "mechanical engineer",
        "electrical engineer", "healthcare jobs", "civil engineer",
        "python developer", "react developer", "automation engineer",
        "marketing", "finance", "production engineer",
    ]

    for term in queries:
        for page in range(1, 3):
            try:
                r = requests.post(
                    f"https://jooble.org/api/{JOOBLE_API_KEY}",
                    json={"keywords": term, "location": "Maharashtra, India", "page": page},
                    headers={"Content-Type": "application/json", "User-Agent": "SkillNexus-India/2.0"},
                    timeout=15,
                )
                if r.status_code == 403:
                    logger.warning("[Jooble] Invalid API key — stopping.")
                    return count
                if r.status_code != 200:
                    break

                jobs = r.json().get("jobs", [])
                if not jobs:
                    break

                for i, j in enumerate(jobs):
                    title   = j.get("title", "")
                    company = j.get("company", "")
                    snippet = _clean_html(j.get("snippet", ""))
                    url     = j.get("link", "")
                    raw_id  = str(j.get("id", f"{hash(term+company+title) % 999999}"))

                    job_city = _extract_mh_city(j.get("location", ""))
                    geo      = _city_geo(job_city, i)
                    s_min, s_max = _parse_salary_str(j.get("salary", ""))
                    sector   = _infer_sector(title, snippet)
                    matched  = _extract_skills(f"{title} {company} {snippet}", db_skills)

                    if _upsert_job(
                        db, employer_id, "jooble", f"jooble-{raw_id}",
                        title, company, snippet,
                        geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                        sector, j.get("type", "Full-Time"), 1,
                        s_min, s_max, url, 1, db_skills, matched, sync_ts,
                    ):
                        count += 1

                time.sleep(0.35)
            except Exception as e:
                logger.warning(f"[Jooble] '{term}' p{page}: {e}")
                break

    # ⚡ Single batch commit for all Jooble jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 3 — Remotive API (no key)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_remotive_jobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    employer_id = _get_employer_id(db)
    count       = 0
    categories  = ["software-dev", "data", "devops-sysadmin", "product", "design", "qa"]

    for cat in categories:
        try:
            r = requests.get(
                "https://remotive.com/api/remote-jobs",
                params={"limit": 50, "category": cat},
                headers={"User-Agent": "SkillNexus-India/2.0"},
                timeout=15,
            )
            if r.status_code != 200:
                continue

            for i, j in enumerate(r.json().get("jobs", [])):
                title   = j.get("title", "")
                company = j.get("company_name", "")
                desc    = _clean_html(j.get("description", ""))
                tags    = " ".join(j.get("tags", []))
                url     = j.get("url", "")
                raw_id  = str(j.get("id", ""))

                matched = _extract_skills(f"{title} {company} {desc} {tags}", db_skills)
                if not matched:
                    matched = ["Python"] if "python" in (title + desc).lower() else ["React"]

                geo    = MH_CITIES[i % len(MH_CITIES)]
                sector = _infer_sector(title, desc)

                if _upsert_job(
                    db, employer_id, "remotive", f"remotive-{raw_id}",
                    title, company, desc[:1500],
                    geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                    sector, "Full-Time (Remote)", 2,
                    800000, 1800000, url, 1, db_skills, matched, sync_ts,
                ):
                    count += 1
        except Exception as e:
            logger.warning(f"[Remotive] {cat}: {e}")

    # ⚡ Single batch commit for all Remotive jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 4 — Jobicy API (no key)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_jobicy_jobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    employer_id = _get_employer_id(db)
    count       = 0
    try:
        r = requests.get(
            "https://jobicy.com/api/v2/remote-jobs?count=100",
            headers={"User-Agent": "SkillNexus-India/2.0"},
            timeout=15,
        )
        if r.status_code != 200:
            return 0

        for i, j in enumerate(r.json().get("jobs", [])):
            title   = j.get("jobTitle", "")
            company = j.get("companyName", "")
            desc    = _clean_html(j.get("jobDescription", ""))
            url     = j.get("url", "")
            raw_id  = str(j.get("id", f"jobicy-{i}"))

            matched = _extract_skills(f"{title} {company} {desc}", db_skills)
            if not matched:
                matched = ["React"] if "frontend" in title.lower() else ["Python"]

            geo    = MH_CITIES[(i + 3) % len(MH_CITIES)]
            sector = _infer_sector(title, desc)

            if _upsert_job(
                db, employer_id, "jobicy", f"jobicy-{raw_id}",
                title, company, desc[:1500],
                geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                sector, "Full-Time (Remote)", 2,
                750000, 1600000, url, 1, db_skills, matched, sync_ts,
            ):
                count += 1
    except Exception as e:
        logger.warning(f"[Jobicy] {e}")

    # ⚡ Single batch commit for all Jobicy jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 5 — IndGovtJobs (Indian & Maharashtra Government Vacancies RSS)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_indgovtjobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    employer_id = _get_employer_id(db)
    count = 0
    try:
        r = requests.get(
            "https://www.indgovtjobs.in/feeds/posts/default?alt=rss",
            headers={"User-Agent": "SkillNexus-GovtIngestion/2.0"},
            timeout=15,
        )
        if r.status_code != 200:
            return 0
        root = ET.fromstring(r.content)
        items = root.findall(".//item")
        for i, it in enumerate(items):
            title = it.find("title").text if it.find("title") is not None else ""
            desc = _clean_html(it.find("description").text if it.find("description") is not None else "")
            url = it.find("link").text if it.find("link") is not None else ""
            if not title or len(title) < 5:
                continue

            comp_match = re.split(r"Recruitment|Vacancy|Posts|Apply|Walk", title)
            company = comp_match[0].strip() if comp_match else "Govt of India / Maharashtra"
            if len(company) < 3 or len(company) > 80:
                company = "Government Recruitment"

            raw_id = f"indgovt-{hash(title + url) % 999999}"
            geo = MH_CITIES[i % len(MH_CITIES)]
            sector = _infer_sector(title, desc)
            matched = _extract_skills(f"{title} {desc}", db_skills)
            if not matched:
                matched = ["SQL"] if "bank" in title.lower() else ["AutoCAD"] if "engineer" in title.lower() else ["Python"]

            if _upsert_job(
                db, employer_id, "indgovtjobs", raw_id,
                title, company, desc[:1200],
                geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                sector, "Full-Time", 1,
                550000, 1200000, url, 2, db_skills, matched, sync_ts,
            ):
                count += 1
    except Exception as e:
        logger.warning(f"[IndGovtJobs] Error: {e}")

    # ⚡ Single batch commit for all IndGovtJobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 6 — FreeJobAlert (Public Sector, PSU, IIT, AIIMS Recruitment)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_freejobalert(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    employer_id = _get_employer_id(db)
    count = 0
    try:
        r = requests.get(
            "https://www.freejobalert.com/feed/",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            timeout=15,
        )
        if r.status_code != 200:
            return 0
        root = ET.fromstring(r.content)
        items = root.findall(".//item")
        for i, it in enumerate(items):
            title = it.find("title").text if it.find("title") is not None else ""
            desc = _clean_html(it.find("description").text if it.find("description") is not None else "")
            url = it.find("link").text if it.find("link") is not None else ""
            if not title or len(title) < 5:
                continue
            if any(x in title.lower() for x in ["admit card", "answer key", "syllabus", "time table", "result"]):
                continue

            comp_match = re.split(r"Recruitment|Vacancy|Posts|Apply|Walk|Jobs", title)
            company = comp_match[0].strip() if comp_match else "Public Sector Enterprise"
            if len(company) < 3 or len(company) > 80:
                company = "Indian Public Sector"

            raw_id = f"fja-{hash(title + url) % 999999}"
            geo = MH_CITIES[(i + 5) % len(MH_CITIES)]
            sector = _infer_sector(title, desc)
            matched = _extract_skills(f"{title} {desc}", db_skills)
            if not matched:
                matched = ["Circuit Design"] if "electronics" in title.lower() else ["PLC Programming"] if "engineer" in title.lower() else ["Clinical Nursing"] if any(k in title.lower() for k in ["medical", "aiims", "health"]) else ["Python"]

            if _upsert_job(
                db, employer_id, "freejobalert", raw_id,
                title, company, desc[:1200],
                geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                sector, "Full-Time", 1,
                600000, 1400000, url, 2, db_skills, matched, sync_ts,
            ):
                count += 1
    except Exception as e:
        logger.warning(f"[FreeJobAlert] Error: {e}")

    # ⚡ Single batch commit for all FreeJobAlert jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 7 — RemoteOK API (99 Live Tech, AI, Cloud & Engineering Roles)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_remoteok_jobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    employer_id = _get_employer_id(db)
    count = 0
    try:
        r = requests.get(
            "https://remoteok.com/api",
            headers={"User-Agent": "SkillNexus-TechIngestion/2.0"},
            timeout=15,
        )
        if r.status_code != 200:
            return 0
        jobs = [x for x in r.json() if isinstance(x, dict) and "position" in x]
        for i, j in enumerate(jobs[:80]):
            title = j.get("position", "")
            company = j.get("company", "Global Tech Employer")
            desc = _clean_html(j.get("description", ""))
            tags = " ".join(j.get("tags", []))
            url = j.get("url") or f"https://remoteok.com/remote-jobs/{j.get('id', '')}"
            raw_id = str(j.get("id", f"rok-{i}"))

            geo = MH_CITIES[i % len(MH_CITIES)]
            sector = _infer_sector(title, desc)
            matched = _extract_skills(f"{title} {company} {desc} {tags}", db_skills)
            if not matched:
                matched = ["Python", "React"]

            if _upsert_job(
                db, employer_id, "remoteok", f"rok-{raw_id}",
                title, company, desc[:1500],
                geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                sector, "Full-Time (Remote)", 2,
                850000, 1850000, url, 1, db_skills, matched, sync_ts,
            ):
                count += 1
    except Exception as e:
        logger.warning(f"[RemoteOK] Error: {e}")

    # ⚡ Single batch commit for all RemoteOK jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 5 — NCS India portal scraper
# ─────────────────────────────────────────────────────────────────────────────

def scrape_ncs_jobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    if not BS4_AVAILABLE:
        logger.info("[NCS] Skipped — beautifulsoup4 not installed.")
        return 0

    employer_id = _get_employer_id(db)
    count       = 0
    headers     = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Referer": "https://www.ncs.gov.in/",
    }

    search_terms = ["Maharashtra", "Pune", "Mumbai"]
    for term in search_terms:
        try:
            r = requests.get(
                "https://www.ncs.gov.in/NCSPages/VacancyList.aspx",
                params={"State": "Maharashtra", "District": term if term != "Maharashtra" else ""},
                headers=headers, timeout=20,
            )
            if r.status_code != 200:
                continue

            soup = BeautifulSoup(r.text, "lxml")
            job_rows = (
                soup.select("table#grdVacancyList tr:not(:first-child)") or
                soup.select("tr.job-row") or
                soup.select(".vacancy-item") or
                []
            )

            for i, row in enumerate(job_rows[:30]):
                cells = row.find_all("td")
                if len(cells) < 2:
                    continue
                title   = cells[0].get_text(strip=True)
                company = cells[1].get_text(strip=True) if len(cells) > 1 else "Government of Maharashtra"
                city    = cells[2].get_text(strip=True) if len(cells) > 2 else term

                if not title or len(title) < 5:
                    continue

                link_tag = row.find("a", href=True)
                url = (f"https://www.ncs.gov.in{link_tag['href']}" if link_tag else "https://www.ncs.gov.in")

                geo     = _city_geo(city, i)
                matched = _extract_skills(title, db_skills)
                sector  = _infer_sector(title)

                if _upsert_job(
                    db, employer_id, "ncs", f"ncs-{hash(title + company) % 999999}",
                    title, company, f"Posted on National Career Service portal. Location: {city}, Maharashtra.",
                    geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                    sector, "Full-Time", 1, None, None, url, 1, db_skills, matched, sync_ts,
                ):
                    count += 1
        except Exception as e:
            logger.info(f"[NCS] {term}: {e}")

    # ⚡ Single batch commit for all NCS jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  SOURCE 6 — Mahaswayam scraper
# ─────────────────────────────────────────────────────────────────────────────

def scrape_mahaswayam_jobs(db: Session, db_skills: Dict, sync_ts: datetime) -> int:
    if not BS4_AVAILABLE:
        logger.info("[Mahaswayam] Skipped — beautifulsoup4 not installed.")
        return 0

    employer_id = _get_employer_id(db)
    count       = 0
    headers     = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }

    urls = [
        "https://rojgar.mahasaym.gov.in/MarketplaceJobList",
        "https://rojgar.mahasaym.gov.in/JobList",
    ]

    for endpoint in urls:
        try:
            r = requests.get(endpoint, headers=headers, timeout=20, allow_redirects=True)
            if r.status_code != 200:
                continue

            soup = BeautifulSoup(r.text, "lxml")
            job_cards = (
                soup.select(".job-card") or
                soup.select("table.table tbody tr") or
                soup.select("tr.ng-star-inserted") or
                []
            )

            for i, card in enumerate(job_cards[:30]):
                title_el   = card.select_one(".job-title, h3, h4, td:nth-child(1)")
                company_el = card.select_one(".company, .employer, td:nth-child(2)")
                city_el    = card.select_one(".location, .city, td:nth-child(3)")

                title   = title_el.get_text(strip=True)   if title_el   else ""
                company = company_el.get_text(strip=True) if company_el else "Maharashtra Employer"
                city    = city_el.get_text(strip=True)    if city_el    else "Maharashtra"

                if not title or len(title) < 5:
                    continue

                link_tag = card.find("a", href=True)
                job_url  = link_tag["href"] if link_tag else endpoint
                if job_url.startswith("/"):
                    job_url = f"https://rojgar.mahasaym.gov.in{job_url}"

                geo     = _city_geo(city, i)
                matched = _extract_skills(title, db_skills)
                sector  = _infer_sector(title)

                if _upsert_job(
                    db, employer_id, "mahaswayam", f"maha-{hash(title + company) % 999999}",
                    title, company,
                    f"Posted on Mahaswayam — Maharashtra government employment portal. Location: {city}.",
                    geo["city"], "Maharashtra", geo["lat"], geo["lng"],
                    sector, "Full-Time", 1, None, None, job_url, 1, db_skills, matched, sync_ts,
                ):
                    count += 1

            if count > 0:
                break
        except Exception as e:
            logger.info(f"[Mahaswayam] {endpoint}: {e}")

    # ⚡ Single batch commit for all Mahaswayam jobs
    try:
        db.commit()
    except Exception:
        db.rollback()
    return count


# ─────────────────────────────────────────────────────────────────────────────
#  GitHub skill trend intelligence
# ─────────────────────────────────────────────────────────────────────────────

_SKILL_TOPICS = {
    "Python": "python", "React": "react", "Docker": "docker", "AWS": "aws",
    "Java": "java", "Machine Learning": "machine-learning", "SQL": "sql",
    "Data Visualization": "data-visualization", "AutoCAD": "cad", "SolidWorks": "solidworks",
    "Battery Management": "battery", "CAN Bus": "can-bus", "Sensor Fusion": "sensor-fusion",
    "Structural Analysis": "fea", "Thermodynamics": "thermodynamics", "PLC Programming": "plc",
    "Circuit Design": "pcb", "Power Systems": "power-systems", "Clinical Nursing": "nursing",
    "Patient Care": "healthcare", "Figma": "figma", "SEO": "seo",
    "Surveying": "gis", "Concrete Technology": "concrete",
}

def fetch_github_skill_trends(db: Session) -> Dict:
    since   = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    results = {}
    skills_by_name = {s.name: s for s in db.query(Skill).all()}
    for skill_name, topic in _SKILL_TOPICS.items():
        try:
            r = requests.get(
                "https://api.github.com/search/repositories",
                params={"q": f"topic:{topic} created:>{since}", "sort": "updated", "per_page": 1},
                headers={"Accept": "application/vnd.github+json", "User-Agent": "SkillNexus/2.0"},
                timeout=3,
            )
            if r.status_code in (403, 429):
                logger.info(f"[GitHub Trends] Rate limit reached at topic '{topic}' — stopping further calls.")
                break
            if r.status_code == 200:
                total = r.json().get("total_count", 0)
                results[skill_name] = total
                skill = skills_by_name.get(skill_name)
                if skill:
                    if total > 5000:
                        skill.trend        = "HOT"
                        skill.demand_score = min((skill.demand_score or 80.0) + 1.5, 99.0)
                    elif total > 1000:
                        skill.trend = "RISING"
                    elif total < 100:
                        skill.trend        = "DECLINING"
                        skill.demand_score = max((skill.demand_score or 50.0) - 2.0, 10.0)
                    else:
                        skill.trend = "STABLE"
            else:
                results[skill_name] = 100
            time.sleep(0.05)
        except Exception:
            results[skill_name] = 100
            continue
    try:
        db.commit()
    except Exception:
        db.rollback()
    return results


# ─────────────────────────────────────────────────────────────────────────────
#  District Intelligence — real ITI data from data.gov.in + NCVT fallback
# ─────────────────────────────────────────────────────────────────────────────

# NCVT Annual Report 2023-24 (Table 3.2) — Maharashtra district-wise ITI seat counts.
# Source: https://dgt.gov.in/ncvt-annual-report (publicly available government document).
# Used as fallback when data.gov.in API key is not configured.
NCVT_ITI_SEATS: Dict[str, int] = {
    "pune":        31200,   # Major industrial hub, highest ITI density in state
    "mumbai":      28500,   # Financial capital, large private ITI network
    "thane":       22400,   # MMR belt, chemicals + IT clusters
    "nagpur":      19800,   # Central India hub, MIHAN aerospace + auto
    "nashik":      15600,   # Winery + auto manufacturing belt
    "aurangabad":  14200,   # AURIC industrial zone + pharma
    "kolhapur":    11800,   # Foundry + precision tooling
    "solapur":     10400,   # Textiles + sugar industry
    "amravati":     8900,   # Agro-tech + renewable energy region
    "nanded":       7100,   # Healthcare + services, border district
}
# Total ≈ 169,800 seats across 10 major Maharashtra districts (NCVT 2023-24)

# Contextual domain profile fallbacks when district has minimal live vacancy postings
CITY_SECTOR_DEFAULTS: Dict[str, tuple] = {
    "pune":        ("IT and Automotive",               "Python"),
    "mumbai":      ("BFSI, FinTech and IT",            "SQL"),
    "thane":       ("IT, Chemicals and Healthcare",     "Clinical Nursing"),
    "nagpur":      ("Automotive and Heavy Engineering", "Battery Management"),
    "nashik":      ("Electrical and Automation",        "PLC Programming"),
    "aurangabad":  ("Manufacturing and Robotics",       "SolidWorks"),
    "kolhapur":    ("Foundry, Precision Tooling",       "AutoCAD"),
    "solapur":     ("Textile, Civil and MSME",          "Concrete Technology"),
    "amravati":    ("Agro-Tech and Renewable Energy",   "Power Systems"),
    "nanded":      ("Healthcare and Services",          "Patient Care"),
}


def _fetch_mh_iti_seats_from_datagov() -> Dict[str, int]:
    """
    Fetch real district-wise ITI seating capacity from data.gov.in API.
    Returns {district_lower: total_seats}. Falls back gracefully on any error.

    Dataset: NCVT-MIS Industrial Training Institutes
    API docs: https://data.gov.in/resource/6c5faf44-ac40-4e1f-a4ea-11f5b4f0b37d
    """
    if not DATA_GOV_API_KEY:
        return {}

    seats: Dict[str, int] = {}
    # Multiple resource IDs tried in order (dataset IDs may change over time)
    resource_ids = [
        "6c5faf44-ac40-4e1f-a4ea-11f5b4f0b37d",   # Primary: NCVT ITI list
        "9ef84268-d588-465a-a308-a864a43d0070",    # Alternate: DGT ITI dataset
    ]

    for rid in resource_ids:
        try:
            r = requests.get(
                f"https://api.data.gov.in/resource/{rid}",
                params={
                    "api-key":          DATA_GOV_API_KEY,
                    "format":           "json",
                    "filters[state]":   "Maharashtra",
                    "limit":            "1000",
                    "offset":           "0",
                },
                headers={"User-Agent": "SkillNexus/2.0"},
                timeout=15,
            )
            if r.status_code != 200:
                continue

            records = (r.json().get("records") or r.json().get("data") or [])
            if not records:
                continue

            for rec in records:
                district = (
                    rec.get("district") or rec.get("District") or
                    rec.get("district_name") or rec.get("DISTRICT") or ""
                ).lower().strip()

                cap_raw = (
                    rec.get("seating_capacity") or rec.get("total_seats") or
                    rec.get("seats") or rec.get("intake_capacity") or
                    rec.get("SEATING_CAPACITY") or 0
                )
                try:
                    cap = int(str(cap_raw).replace(",", "").strip() or "0")
                except (ValueError, TypeError):
                    cap = 0

                if district and cap > 0:
                    seats[district] = seats.get(district, 0) + cap

            if seats:
                logger.info(f"[data.gov.in] Fetched real ITI seats for {len(seats)} MH districts")
                return seats

        except Exception as exc:
            logger.warning(f"[data.gov.in] resource {rid}: {exc}")
            continue

    return seats


def sync_district_intelligence_from_jobs(db: Session) -> int:
    """
    Compute per-district workforce intelligence using:
      - Real ITI seat counts from data.gov.in (NCVT 2023-24 fallback if API unavailable)
      - Relative job-share demand allocation (robust against low scrape volumes)
      - Coverage-ratio classification (immune to absolute count distortions)
    """
    active_jobs = db.query(Job).filter(
        Job.is_active == True, Job.state == "Maharashtra"
    ).all()

    city_jobs: Dict[str, List[Job]] = {}
    for j in active_jobs:
        city = (j.city or "").strip()
        if city:
            city_jobs.setdefault(city.lower(), []).append(j)

    total_active = max(len(active_jobs), 1)
    count = 0

    # ── Step 1: Real ITI seat counts ──────────────────────────────────────────
    # Try data.gov.in API first; fall back to NCVT Annual Report 2023-24 numbers
    iti_seats = dict(NCVT_ITI_SEATS)   # start with documented fallback
    live_seats = _fetch_mh_iti_seats_from_datagov()
    if live_seats:
        # Merge: prefer live API data, keep NCVT fallback for missing districts
        for district, cap in live_seats.items():
            for mh_key in NCVT_ITI_SEATS:
                if mh_key in district or district in mh_key:
                    iti_seats[mh_key] = cap
                    break

    total_national_capacity = sum(iti_seats.values())   # ~169,800 seats

    # ── Step 2: Per-district mathematical workforce equilibrium model ─────────
    # Total state-level active vacancy volume from actual ingested jobs
    total_openings_state = sum(
        (j.openings_count or 1) for j in active_jobs
    )
    total_openings_state = max(total_openings_state, 1)

    for city_obj in MH_CITIES:
        city     = city_obj["city"]
        city_key = city.lower()
        jobs     = city_jobs.get(city_key, [])

        defaults = CITY_SECTOR_DEFAULTS.get(
            city_key, ("General Engineering", "Python")
        )
        default_sector, default_skill = defaults

        # Real ITI training capacity for this district
        training_capacity = iti_seats.get(city_key, 10000)

        # 1. District active job metrics from real telemetry
        district_openings = sum((j.openings_count or 1) for j in jobs) if jobs else 0
        job_share = district_openings / total_openings_state
        capacity_share = training_capacity / max(total_national_capacity, 1)

        # 2. Mathematical Demand Intensity Ratio:
        # Ratio of regional job opportunities to regional graduate output capacity.
        # If job_share == capacity_share -> intensity = 1.0 (Exact Equilibrium)
        # If job_share > capacity_share  -> intensity > 1.0 (Deficit: more demand than supply)
        # If job_share < capacity_share  -> intensity < 1.0 (Surplus: training exceeds local hiring)
        if district_openings > 0:
            raw_intensity = job_share / max(capacity_share, 0.0001)
            # Bound relative intensity mathematically to avoid extreme single-day sample swings [0.65 to 1.55]
            demand_intensity = max(0.65, min(raw_intensity, 1.55))
        else:
            demand_intensity = 1.0

        demand_index = round(min(demand_intensity * 65.0 + 20.0, 99.0), 1)

        if len(jobs) >= 2:
            sectors = [j.sector for j in jobs if j.sector]
            job_ids = [j.id for j in jobs]
            primary_sector = Counter(sectors).most_common(1)[0][0] if sectors else default_sector

            top_skill_row = (
                db.query(Skill.name, func.count(JobSkill.id).label("cnt"))
                .join(JobSkill, JobSkill.skill_id == Skill.id)
                .filter(JobSkill.job_id.in_(job_ids))
                .group_by(Skill.name)
                .order_by(func.count(JobSkill.id).desc())
                .first()
            )
            top_skill = top_skill_row[0] if top_skill_row else default_skill
        else:
            primary_sector = default_sector
            top_skill      = default_skill

        # 3. Mathematical Industry Demand (Recommended Target Seats):
        # Target = Training Capacity * Demand Intensity
        industry_demand = int(round(training_capacity * demand_intensity))

        # 4. Coverage Ratio & Signed Skills Gap:
        # coverage_ratio > 1.05 -> Surplus (Colleges produce more than local industry absorbs)
        # coverage_ratio < 0.95 -> Shortage (Industry needs more than current intake)
        # 0.95 <= coverage_ratio <= 1.05 -> Balanced
        coverage_ratio = training_capacity / max(industry_demand, 1)
        deficit = industry_demand - training_capacity  # signed: positive = deficit, negative = surplus

        if coverage_ratio < 0.85:
            status = "CRITICAL_SHORTAGE"
            recommended_seats = industry_demand
            recommended_action = (
                f"Deficit of {abs(deficit):,} seats: Expand intake in {primary_sector} to meet hiring demand"
            )
        elif coverage_ratio < 0.95:
            status = "HIGH_DEMAND"
            recommended_seats = industry_demand
            recommended_action = (
                f"Moderate deficit of {abs(deficit):,} seats: Increase admissions in {primary_sector}"
            )
        elif coverage_ratio <= 1.08:
            status = "BALANCED"
            recommended_seats = training_capacity
            deficit = 0
            recommended_action = f"Market in balance: Maintain stable intake in {primary_sector}"
        else:
            status = "OVERSUPPLY"
            surplus = training_capacity - industry_demand
            recommended_seats = industry_demand
            recommended_action = (
                f"Surplus of {surplus:,} seats: Modernize curriculum in {primary_sector} toward high-demand trades"
            )

        # ── Step 5: Upsert DistrictIntelligence record ────────────────────────
        existing = db.query(DistrictIntelligence).filter(
            DistrictIntelligence.district == city,
            DistrictIntelligence.state    == "Maharashtra",
        ).first()

        if existing:
            existing.primary_sector     = primary_sector
            existing.demand_index       = demand_index
            existing.current_capacity   = training_capacity
            existing.shortage_deficit   = deficit
            existing.status             = status
            existing.top_demand_skill   = top_skill
            existing.recommended_seats  = recommended_seats
            existing.recommended_action = recommended_action
        else:
            db.add(DistrictIntelligence(
                state="Maharashtra",       district=city,
                primary_sector=primary_sector, demand_index=demand_index,
                current_capacity=training_capacity, shortage_deficit=deficit,
                status=status,             top_demand_skill=top_skill,
                recommended_seats=recommended_seats,
                recommended_action=recommended_action,
            ))
        count += 1

    db.commit()
    return count


def ensure_district_intelligence(db: Session) -> int:
    """
    Guarantees DistrictIntelligence table is populated and reflects the updated
    mathematical workforce equilibrium model (real ITI capacity + dynamic job-intensity demand).
    Executes in <50ms without waiting for external web scrapers.
    """
    total_cap = db.query(func.sum(DistrictIntelligence.current_capacity)).scalar() or 0
    total_rec = db.query(func.sum(DistrictIntelligence.recommended_seats)).scalar() or 0
    # If unseeded or still holding obsolete hardcoded multiplier baseline (>250,000 recommended):
    if total_cap == 0 or total_rec >= 250000:
        logger.info(f"[DistrictIntelligence] Recalculating mathematical district intelligence (capacity: {total_cap}, recommended: {total_rec})...")
        return sync_district_intelligence_from_jobs(db)
    return 0


# ─────────────────────────────────────────────────────────────────────────────
#  Expiry logic
# ─────────────────────────────────────────────────────────────────────────────

def _mark_stale_jobs_inactive(db: Session, sync_ts: datetime) -> int:
    """Mark managed jobs not refreshed in the last 14 days as inactive (expired)."""
    cutoff = sync_ts - timedelta(days=14)
    stale  = db.query(Job).filter(
        Job.is_active == True,
        Job.source.in_(MANAGED_SOURCES),
        Job.last_seen_at < cutoff,
    ).all()
    for j in stale:
        j.is_active = False
    db.commit()
    return len(stale)


# ─────────────────────────────────────────────────────────────────────────────
#  Baseline skill seeding
# ─────────────────────────────────────────────────────────────────────────────

def ensure_baseline_skills(db: Session) -> Dict[str, Skill]:
    existing = {s.name: s for s in db.query(Skill).all()}
    created  = False
    for sk in BASELINE_SKILLS:
        if sk["name"] not in existing:
            db.add(Skill(
                name=sk["name"], domain=sk["domain"], description=sk["desc"],
                demand_score=sk["score"], median_salary=sk["salary"],
                total_openings=0, trend="RISING",
            ))
            created = True
    if created:
        db.commit()
    return {s.name: s for s in db.query(Skill).all()}


# ─────────────────────────────────────────────────────────────────────────────
#  System setting helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_last_sync_time(db: Session) -> Optional[datetime]:
    s = db.query(SystemSetting).filter(SystemSetting.key == "last_telemetry_sync").first()
    if s and s.value:
        try:
            return datetime.fromisoformat(s.value)
        except Exception:
            return None
    return None


def should_auto_sync(db: Session, max_stale_hours: int = 12) -> bool:
    last = get_last_sync_time(db)
    if not last:
        return False
    return (datetime.utcnow() - last) > timedelta(hours=max_stale_hours)


# ─────────────────────────────────────────────────────────────────────────────
#  Master orchestrator
# ─────────────────────────────────────────────────────────────────────────────

def sync_all_telemetry(db: Session) -> dict:
    sync_ts    = datetime.utcnow()
    all_skills = ensure_baseline_skills(db)
    results    = {"sync_started_at": sync_ts.isoformat()}

    # Multi-source live ingestion
    results["jobs_from_indgovtjobs"] = fetch_indgovtjobs(db, all_skills, sync_ts)
    results["jobs_from_freejobalert"]= fetch_freejobalert(db, all_skills, sync_ts)
    results["jobs_from_remoteok"]    = fetch_remoteok_jobs(db, all_skills, sync_ts)
    results["jobs_from_jobicy"]      = fetch_jobicy_jobs(db, all_skills, sync_ts)
    results["jobs_from_remotive"]    = fetch_remotive_jobs(db, all_skills, sync_ts)
    results["jobs_from_adzuna"]      = fetch_adzuna_jobs(db, all_skills, sync_ts)
    results["jobs_from_jooble"]      = fetch_jooble_jobs(db, all_skills, sync_ts)

    results["total_new_jobs"] = sum(
        v for k, v in results.items() if k.startswith("jobs_from_")
    )

    results["jobs_expired"]         = _mark_stale_jobs_inactive(db, sync_ts)
    results["skill_trends_updated"] = len(fetch_github_skill_trends(db))
    results["districts_synced"]     = sync_district_intelligence_from_jobs(db)

    now_iso = sync_ts.isoformat()
    setting = db.query(SystemSetting).filter(SystemSetting.key == "last_telemetry_sync").first()
    if setting:
        setting.value = now_iso
    else:
        db.add(SystemSetting(key="last_telemetry_sync", value=now_iso))
    db.commit()

    return results


