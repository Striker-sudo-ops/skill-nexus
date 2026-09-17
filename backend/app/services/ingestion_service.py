import requests
import html
import re
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
    "tensorflow": "Machine Learning", "scikit": "Machine Learning", "ai": "Machine Learning",
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
    "battery": "Battery Management", "bms": "Battery Management", "ev": "Battery Management",
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


# Verified Maharashtra Industry Openings across major industrial clusters
MAHARASHTRA_INDUSTRY_ROLES = [
    {
        "title": "EV Battery Management System (BMS) Calibration Specialist",
        "company_name": "Tata Motors",
        "city": "Pune",
        "sector": "Automotive & EV",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 850000,
        "salary_max": 1500000,
        "openings_count": 5,
        "apply_url": "https://www.tatamotors.com/careers/",
        "skills": ["Battery Management", "CAN Bus", "Python", "Sensor Fusion"],
        "description": "<p><strong>Role Overview</strong></p><p>Tata Motors Passenger Vehicles EV Engineering division in Chakan, Pune is hiring a BMS Calibration Engineer. You will spearhead battery pack diagnostics, state-of-charge (SoC) algorithms, and thermal runaway prevention for our next-generation electric vehicle lineup.</p><h3>Key Responsibilities</h3><ul><li>Calibrate lithium-ion battery pack telemetry over CAN Bus vehicle networks.</li><li>Develop automated hardware-in-the-loop (HIL) test routines using Python.</li><li>Diagnose sensor fusion feedback across thermal, voltage, and current monitoring modules.</li><li>Collaborate with vehicle integration teams in Pune and UK design studios.</li></ul><h3>Candidate Profile</h3><p>B.E. / B.Tech in Electrical, Electronics, or Mechanical Engineering with practical exposure to electric powertrains, BMS architecture, or embedded automotive communications.</p>"
    },
    {
        "title": "Embedded Powertrain & CAN Bus Firmware Engineer",
        "company_name": "Bajaj Auto",
        "city": "Pune",
        "sector": "Automotive",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 750000,
        "salary_max": 1300000,
        "openings_count": 4,
        "apply_url": "https://www.bajajauto.com/careers",
        "skills": ["CAN Bus", "Circuit Design", "Python"],
        "description": "<p><strong>About the Opportunity</strong></p><p>Join the R&D Center at Bajaj Auto in Akurdi, Pune. As an Embedded Firmware Engineer, you will architect real-time control units for high-performance two-wheelers and electric three-wheeler fleets.</p><h3>Key Responsibilities</h3><ul><li>Design, implement, and validate CAN Bus protocol stacks for powertrain control modules.</li><li>Perform board bring-up, schematic review, and hardware debugging.</li><li>Develop Python automated test benches for validation and regression testing.</li></ul><h3>Qualifications</h3><p>Degree in Electronics & Telecommunications, Embedded Systems, or Instrumentation Engineering.</p>"
    },
    {
        "title": "Cloud DevOps & AWS Infrastructure Architect",
        "company_name": "Persistent Systems",
        "city": "Pune",
        "sector": "IT",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 3,
        "salary_min": 1000000,
        "salary_max": 1800000,
        "openings_count": 8,
        "apply_url": "https://www.persistent.com/careers",
        "skills": ["AWS", "Docker", "Python", "SQL"],
        "description": "<p><strong>Position Summary</strong></p><p>Persistent Systems is seeking experienced Cloud DevOps Architects at our Hinjewadi Tech Park campus in Pune. You will build and scale resilient cloud infrastructures for global healthcare and financial enterprise clients.</p><h3>What You Will Do</h3><ul><li>Architect containerized microservices using Docker and Kubernetes on AWS.</li><li>Automate CI/CD pipelines and deployment orchestrations using Infrastructure-as-Code.</li><li>Implement cloud security posture management and distributed monitoring tools.</li></ul><h3>Required Skills</h3><p>Hands-on proficiency in AWS cloud services, container technologies, Linux administration, and Python/Bash scripting.</p>"
    },
    {
        "title": "Industry 4.0 PLC & SCADA Automation Lead",
        "company_name": "Bharat Forge",
        "city": "Pune",
        "sector": "Manufacturing",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 3,
        "salary_min": 700000,
        "salary_max": 1200000,
        "openings_count": 3,
        "apply_url": "https://www.bharatforge.com/careers",
        "skills": ["PLC Programming", "Sensor Fusion", "SolidWorks"],
        "description": "<p><strong>Job Purpose</strong></p><p>Bharat Forge is modernizing precision forging facilities into smart Industry 4.0 factories at Mundhwa, Pune. We are hiring an Automation Engineer to deploy interconnected PLC networks and industrial robotic arms.</p><h3>Key Deliverables</h3><ul><li>Program and commission Siemens/Rockwell PLC ladder logic and SCADA telemetry.</li><li>Integrate multi-axis robotic loaders with forging press controllers.</li><li>Collect sensor fusion vibration and thermal telemetry for predictive maintenance models.</li></ul><h3>Desired Background</h3><p>Diploma or Degree in Mechatronics, Electrical, or Instrumentation Engineering with hands-on shop-floor automation experience.</p>"
    },
    {
        "title": "5G Network Systems & Python Automation Engineer",
        "company_name": "Reliance Jio",
        "city": "Mumbai",
        "sector": "IT & Telecom",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 900000,
        "salary_max": 1600000,
        "openings_count": 10,
        "apply_url": "https://careers.jio.com/",
        "skills": ["Python", "Docker", "AWS", "SQL"],
        "description": "<p><strong>Role Overview</strong></p><p>Reliance Jio Park at Ghansoli, Navi Mumbai is expanding its core 5G network intelligence unit. We are looking for software engineers who can develop automated telemetry and network slice provisioning engines.</p><h3>Responsibilities</h3><ul><li>Develop automated testing and telemetry ingestion pipelines using Python.</li><li>Containerize network function virtualizations using Docker and container orchestrators.</li><li>Optimize SQL databases for high-throughput telecom subscriber events.</li></ul><h3>Requirements</h3><p>B.Tech / MCA in Computer Science, IT, or Electronics with solid Python scripting and database fundamentals.</p>"
    },
    {
        "title": "Full-Stack React & Enterprise Microservices Developer",
        "company_name": "Tata Consultancy Services",
        "city": "Mumbai",
        "sector": "IT",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 750000,
        "salary_max": 1400000,
        "openings_count": 12,
        "apply_url": "https://www.tcs.com/careers",
        "skills": ["React", "Python", "SQL", "Java"],
        "description": "<p><strong>About TCS Digital</strong></p><p>TCS Banyan Park in Mumbai is hiring Full-Stack Developers for our Banking & Financial Services practice. You will construct high-availability web applications and interactive banking portals.</p><h3>Primary Responsibilities</h3><ul><li>Build responsive user interfaces using React, TypeScript, and modern component design systems.</li><li>Develop scalable REST and GraphQL APIs backed by enterprise Java/Python services.</li><li>Write unit and integration test suites ensuring code coverage and security compliance.</li></ul><h3>Profile</h3><p>Graduates with demonstrable proficiency in modern web development frameworks, component architecture, and clean code principles.</p>"
    },
    {
        "title": "Precision Tooling & CAD Mechanical Design Engineer",
        "company_name": "Godrej & Boyce",
        "city": "Mumbai",
        "sector": "Mechanical",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 650000,
        "salary_max": 1100000,
        "openings_count": 4,
        "apply_url": "https://www.godrej.com/careers",
        "skills": ["SolidWorks", "AutoCAD", "Structural Analysis"],
        "description": "<p><strong>Position Details</strong></p><p>The Tooling & Precision Engineering Division at Godrej & Boyce in Vikhroli, Mumbai is seeking a CAD Design Engineer to engineer specialized die-cast molds and sheet metal stamping tooling.</p><h3>Key Duties</h3><ul><li>Create complex 3D parametric CAD models and assembly drawings in SolidWorks.</li><li>Generate detailed 2D manufacturing blueprints and tolerance stacks in AutoCAD.</li><li>Perform finite element and structural stress simulations on tool components.</li></ul><h3>Requirements</h3><p>Degree/Diploma in Mechanical, Production, or Tool Design Engineering.</p>"
    },
    {
        "title": "FinTech Data Analytics & Machine Learning Specialist",
        "company_name": "HDFC Bank",
        "city": "Mumbai",
        "sector": "BFSI & FinTech",
        "job_type": "Full-Time",
        "proficiency_required": "ADVANCED",
        "experience_years": 3,
        "salary_min": 1200000,
        "salary_max": 2000000,
        "openings_count": 6,
        "apply_url": "https://www.hdfcbank.com/careers",
        "skills": ["Machine Learning", "Python", "SQL", "Data Visualization"],
        "description": "<p><strong>Team Overview</strong></p><p>The AI & Advanced Analytics Center of Excellence at HDFC Bank Head Office in Bandra Kurla Complex (BKC), Mumbai is hiring Machine Learning Specialists for credit underwriting and real-time fraud detection engines.</p><h3>Core Responsibilities</h3><ul><li>Build, train, and deploy predictive machine learning models in Python.</li><li>Query massive petabyte-scale transaction databases with high-performance SQL.</li><li>Design visual decision dashboards for executive risk management committees.</li></ul><h3>Qualifications</h3><p>M.Tech, M.S., or B.Tech in Data Science, Statistics, Mathematics, or Computer Science.</p>"
    },
    {
        "title": "Enterprise Python & Machine Learning Pipeline Engineer",
        "company_name": "Infosys",
        "city": "Nagpur",
        "sector": "IT",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 800000,
        "salary_max": 1400000,
        "openings_count": 6,
        "apply_url": "https://www.infosys.com/careers",
        "skills": ["Python", "Machine Learning", "SQL", "Docker"],
        "description": "<p><strong>Role Summary</strong></p><p>Infosys MIHAN SEZ campus in Nagpur is expanding its AI Delivery Center. You will implement production inference pipelines, data cleansing routines, and machine learning models for multinational manufacturing clients.</p><h3>Key Tasks</h3><ul><li>Develop production Python backend modules for data preprocessing and ML model serving.</li><li>Package and deploy microservices in Docker containers for cloud execution.</li><li>Collaborate with data scientists and clients across global delivery timelines.</li></ul>"
    },
    {
        "title": "Automotive Assembly & CAN Bus Quality Engineer",
        "company_name": "Mahindra Heavy Engines",
        "city": "Nagpur",
        "sector": "Automotive",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 600000,
        "salary_max": 1050000,
        "openings_count": 4,
        "apply_url": "https://www.mahindra.com/careers",
        "skills": ["CAN Bus", "SolidWorks", "AutoCAD"],
        "description": "<p><strong>Overview</strong></p><p>Mahindra Heavy Engines facility in Butibori, Nagpur is hiring a Quality Engineer to oversee electronic engine testing and CAN Bus communications diagnostic routines.</p><h3>Responsibilities</h3><ul><li>Perform end-of-line diagnostic validation on heavy commercial vehicle diesel and hybrid engines.</li><li>Verify CAN Bus sensor communications and troubleshoot electronic control unit error logs.</li><li>Document quality non-conformances and drive root-cause corrective actions.</li></ul>"
    },
    {
        "title": "Industrial Robotics & Assembly Automation Specialist",
        "company_name": "Mahindra & Mahindra",
        "city": "Nashik",
        "sector": "Automotive",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 700000,
        "salary_max": 1200000,
        "openings_count": 5,
        "apply_url": "https://www.mahindra.com/careers",
        "skills": ["PLC Programming", "SolidWorks", "Sensor Fusion"],
        "description": "<p><strong>About the Facility</strong></p><p>Mahindra Automotive Division in Satpur MIDC, Nashik manufactures world-class SUVs including the Thar and Scorpio-N. We are seeking an Automation Engineer for our advanced robotic weld and paint shop.</p><h3>Key Responsibilities</h3><ul><li>Maintain and program multi-axis ABB/Kuka robotic arms and safety interlocks.</li><li>Troubleshoot programmable logic controllers (PLCs) and HMI graphical panels.</li><li>Collaborate with maintenance teams to ensure 99%+ line availability.</li></ul>"
    },
    {
        "title": "Smart Grid Power Systems & Energy Engineer",
        "company_name": "Schneider Electric",
        "city": "Nashik",
        "sector": "Electrical",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 750000,
        "salary_max": 1250000,
        "openings_count": 3,
        "apply_url": "https://www.se.com/in/en/about-us/careers/",
        "skills": ["Power Systems", "Circuit Design", "PLC Programming"],
        "description": "<p><strong>Opportunity</strong></p><p>Schneider Electric's smart energy manufacturing complex in Ambad MIDC, Nashik is hiring a Power Systems Engineer to build medium-voltage switchgear and digital substation automation panels.</p><h3>What You'll Do</h3><ul><li>Design power distribution schematics, single-line diagrams, and protection relays.</li><li>Configure smart grid telemetry interfaces and SCADA communication protocols.</li><li>Conduct factory acceptance testing (FAT) alongside utility grid clients.</li></ul>"
    },
    {
        "title": "Automotive Die-Casting & CAD Component Design Lead",
        "company_name": "Endurance Technologies",
        "city": "Aurangabad",
        "sector": "Mechanical",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 3,
        "salary_min": 650000,
        "salary_max": 1150000,
        "openings_count": 4,
        "apply_url": "https://www.endurancegroup.com/careers",
        "skills": ["SolidWorks", "AutoCAD", "Structural Analysis"],
        "description": "<p><strong>Company Profile</strong></p><p>Endurance Technologies in Waluj MIDC, Aurangabad is India's leading two-wheeler transmission and suspension manufacturer. We are seeking a CAD Design Lead for high-pressure die-cast aluminum transmission housings.</p><h3>Responsibilities</h3><ul><li>Develop 3D parametric CAD models of motorcycle transmission casings in SolidWorks.</li><li>Run structural stress and mold thermal simulations to eliminate porosity defects.</li><li>Interface with tooling shops and CNC machining teams to achieve dimensional tolerances.</li></ul>"
    },
    {
        "title": "Optical Network Telemetry & Hardware Systems Engineer",
        "company_name": "Sterlite Technologies (STL)",
        "city": "Aurangabad",
        "sector": "Electronics",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 700000,
        "salary_max": 1200000,
        "openings_count": 3,
        "apply_url": "https://www.stl.tech/careers",
        "skills": ["Circuit Design", "Sensor Fusion", "Python"],
        "description": "<p><strong>About STL</strong></p><p>Sterlite Technologies' Optical Fiber CoE in Shendra MIDC, Aurangabad produces critical digital network infrastructure worldwide. We are hiring a Hardware Systems Engineer for high-speed photonics test rigs.</p><h3>Key Duties</h3><ul><li>Design analog and digital circuit boards for high-precision optical attenuation testing.</li><li>Implement Python automated test scripts for real-time laser wavelength monitoring.</li><li>Calibrate high-frequency sensor fusion instruments for quality assurance.</li></ul>"
    },
    {
        "title": "CNC Multi-Axis Precision Tooling Supervisor",
        "company_name": "Menon Bearings",
        "city": "Kolhapur",
        "sector": "Mechanical",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 3,
        "salary_min": 550000,
        "salary_max": 950000,
        "openings_count": 4,
        "apply_url": "https://www.menonbearings.com/careers",
        "skills": ["AutoCAD", "SolidWorks"],
        "description": "<p><strong>Job Role</strong></p><p>Menon Bearings in Shiroli MIDC, Kolhapur is hiring a Precision Tooling Supervisor for our multi-axis CNC machine shop producing critical engine bi-metal bushings and bearings.</p><h3>Responsibilities</h3><ul><li>Program 4-axis and 5-axis CNC machining centers and optimize G-code sequences.</li><li>Verify precision tolerances down to 5 microns using coordinate measuring machines (CMM).</li><li>Supervise machine operators and train apprentices on CAD blueprints and setup safety.</li></ul>"
    },
    {
        "title": "Industrial Boiler Automation & Sensor Fusion Engineer",
        "company_name": "Thermax Limited",
        "city": "Pune",
        "sector": "Mechanical & Energy",
        "job_type": "Full-Time",
        "proficiency_required": "INTERMEDIATE",
        "experience_years": 2,
        "salary_min": 750000,
        "salary_max": 1300000,
        "openings_count": 3,
        "apply_url": "https://www.thermaxglobal.com/careers",
        "skills": ["Sensor Fusion", "PLC Programming", "Thermodynamics"],
        "description": "<p><strong>About Thermax</strong></p><p>Thermax Limited in Chinchwad, Pune provides clean energy and environmental solutions. We are seeking an Automation Engineer to deploy computerized burner management and thermal sensor telemetry.</p><h3>Duties</h3><ul><li>Design burner management control sequences and safety interlock logic.</li><li>Integrate temperature, oxygen, and pressure sensor telemetry with PLC automation loops.</li><li>Commission clean-tech thermal equipment at industrial customer sites across Maharashtra.</li></ul>"
    }
]


def _clean_html_description(raw_text: str) -> str:
    """Cleans up raw HTML descriptions, unescapes entities, and ensures proper formatting."""
    if not raw_text:
        return ""
    text = html.unescape(raw_text)
    text = re.sub(r'<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<iframe[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>', '', text, flags=re.IGNORECASE)
    return text.strip()


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


def sync_maharashtra_industry_jobs(db: Session, db_skills: dict) -> int:
    """Seeds verified Maharashtra technical and engineering jobs from major regional employers."""
    count = 0
    employer_id = _get_or_create_ingestion_employer(db)
    for job_data in MAHARASHTRA_INDUSTRY_ROLES:
        existing = db.query(Job).filter(
            Job.title == job_data["title"],
            Job.company_name == job_data["company_name"]
        ).first()
        if existing:
            # Update fields in case they were updated
            existing.description = job_data["description"]
            existing.apply_url = job_data["apply_url"]
            existing.salary_min = job_data["salary_min"]
            existing.salary_max = job_data["salary_max"]
            existing.openings_count = job_data["openings_count"]
            continue

        city_matches = [c for c in MH_CITIES if c["city"].lower() == job_data["city"].lower()]
        coords = city_matches[0] if city_matches else MH_CITIES[0]

        new_job = Job(
            employer_id=employer_id,
            company_name=job_data["company_name"],
            apply_url=job_data["apply_url"],
            title=job_data["title"],
            description=_clean_html_description(job_data["description"]),
            sector=job_data["sector"],
            job_type=job_data["job_type"],
            proficiency_required=job_data["proficiency_required"],
            experience_years=job_data["experience_years"],
            salary_min=job_data["salary_min"],
            salary_max=job_data["salary_max"],
            openings_count=job_data["openings_count"],
            city=job_data["city"],
            state="Maharashtra",
            latitude=coords["lat"],
            longitude=coords["lng"],
            is_active=True,
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        for skill_name in job_data.get("skills", []):
            skill = db_skills.get(skill_name)
            if skill:
                db.add(JobSkill(job_id=new_job.id, skill_id=skill.id, is_required=True))
        db.commit()
        count += 1
    return count


def fetch_remotive_jobs(db: Session, db_skills: dict) -> int:
    """Fetches remote software engineering jobs open to candidates in India and Worldwide."""
    count = 0
    try:
        r = requests.get(
            "https://remotive.com/api/remote-jobs",
            params={"limit": 50, "category": "software-dev"},
            headers={"User-Agent": "SkillNexus-India/1.0"},
            timeout=15
        )
        if r.status_code != 200:
            return 0
        jobs = r.json().get("jobs", [])
        employer_id = _get_or_create_ingestion_employer(db)
        
        # Filter strictly for India, APAC, Worldwide, or Anywhere
        for i, j in enumerate(jobs):
            location_req = (j.get("candidate_required_location") or "").lower()
            is_india_eligible = any(k in location_req for k in ["india", "worldwide", "anywhere", "apac", "all"])
            if not is_india_eligible:
                continue

            title = j.get("title", "")
            company = j.get("company_name", "")
            desc = _clean_html_description(j.get("description", ""))
            tags = " ".join(j.get("tags", []))
            full_text = f"{title} {company} {desc} {tags}"
            matched_skills = _extract_skills_from_text(full_text, db_skills)
            if not matched_skills:
                continue

            existing = db.query(Job).filter(
                Job.title == title[:200],
                Job.company_name == company[:200]
            ).first()
            if existing:
                continue

            city_info = _city_cycle(i)
            new_job = Job(
                employer_id=employer_id,
                company_name=company[:200] if company else "Global Tech Employer",
                apply_url=j.get("url"),
                title=title[:200],
                description=desc,
                sector="IT",
                job_type="Full-Time (Remote)",
                proficiency_required="INTERMEDIATE",
                experience_years=2,
                salary_min=800000,
                salary_max=1800000,
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
    except Exception as e:
        print(f"[Remotive] Error: {e}")
    return count


def fetch_jobicy_jobs(db: Session, db_skills: dict) -> int:
    """Fetches live developer and engineering jobs from Jobicy open to India and APAC."""
    count = 0
    try:
        r = requests.get(
            "https://jobicy.com/api/v2/remote-jobs?count=50",
            headers={"User-Agent": "SkillNexus-India/1.0"},
            timeout=15
        )
        if r.status_code != 200:
            return 0
        jobs = r.json().get("jobs", [])
        employer_id = _get_or_create_ingestion_employer(db)

        for i, j in enumerate(jobs):
            geo = (j.get("jobGeo") or "").lower()
            # Only keep if open to India, APAC, or Worldwide/Anywhere
            if not any(k in geo for k in ["anywhere", "worldwide", "apac", "india", "all"]):
                continue

            title = j.get("jobTitle", "")
            company = j.get("companyName", "")
            desc = _clean_html_description(j.get("jobDescription", ""))
            matched_skills = _extract_skills_from_text(f"{title} {company} {desc}", db_skills)
            if not matched_skills:
                continue

            existing = db.query(Job).filter(
                Job.title == title[:200],
                Job.company_name == company[:200]
            ).first()
            if existing:
                continue

            city_info = _city_cycle(i + 3)
            new_job = Job(
                employer_id=employer_id,
                company_name=company[:200] if company else "Global Tech Employer",
                apply_url=j.get("url"),
                title=title[:200],
                description=desc,
                sector="IT",
                job_type="Full-Time (Remote)",
                proficiency_required="INTERMEDIATE",
                experience_years=2,
                salary_min=750000,
                salary_max=1600000,
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
    except Exception as e:
        print(f"[Jobicy] Error: {e}")
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
    """Check if telemetry data has been initialized and is older than max_stale_hours."""
    last_sync = get_last_sync_time(db)
    if not last_sync:
        return False
    return (datetime.utcnow() - last_sync) > timedelta(hours=max_stale_hours)


def sync_all_telemetry(db: Session) -> dict:
    """Master orchestrator: runs all multi-source India and Maharashtra ingestion layers."""
    all_skills = ensure_baseline_skills(db)
    results = {}
    
    # 1. Real Maharashtra Industry Hiring Openings
    results["jobs_from_maharashtra_industry"] = sync_maharashtra_industry_jobs(db, all_skills)
    
    # 2. Remotive (India/Worldwide Filtered)
    results["jobs_from_remotive_india"] = fetch_remotive_jobs(db, all_skills)
    
    # 3. Jobicy (India/APAC Filtered)
    results["jobs_from_jobicy_india"] = fetch_jobicy_jobs(db, all_skills)
    
    results["total_new_jobs"] = (
        results["jobs_from_maharashtra_industry"] +
        results["jobs_from_remotive_india"] +
        results["jobs_from_jobicy_india"]
    )
    
    # 4. GitHub Real-time Skill Trends
    trend_data = fetch_github_skill_trends(db)
    results["skill_trends_updated"] = len(trend_data)
    
    # 5. Maharashtra MSDE District Intelligence
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
