from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.entities import (
    User, Student, StudentLocation, StudentEducation, StudentSkill, StudentInterest,
    Course, StudentCourse, StudentCertificate, Employer, Job, JobSkill, Skill,
    SkillResource, QuizQuestion, DistrictIntelligence, Trainer, CurriculumUpdate,
    CandidateFeedback, IndustryConsultation, TrainingInstitute
)
from app.core.security import hash_password
from datetime import datetime

def seed(force_reseed=False):
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.email.in_(["admin@skillnexus.in", "admin@skillbridge.in"])).first()
        if admin_exists and not force_reseed:
            # Check if skillnexus accounts need to be created in existing DB
            nexus_adm = db.query(User).filter(User.email == "admin@skillnexus.in").first()
            if not nexus_adm:
                stu_pw = hash_password("Demo@123")
                emp_pw = hash_password("Demo@123")
                adm_pw = hash_password("Admin@123")
                db.add_all([
                    User(email="demo.student@skillnexus.in", password_hash=stu_pw, role="STUDENT"),
                    User(email="demo.employer@skillnexus.in", password_hash=emp_pw, role="EMPLOYER"),
                    User(email="admin@skillnexus.in", password_hash=adm_pw, role="ADMIN")
                ])
                db.commit()
            return

        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        stu_pw = hash_password("Demo@123")
        emp_pw = hash_password("Demo@123")
        adm_pw = hash_password("Admin@123")

        user_stu = User(email="demo.student@skillnexus.in", password_hash=stu_pw, role="STUDENT")
        user_emp = User(email="demo.employer@skillnexus.in", password_hash=emp_pw, role="EMPLOYER")
        user_adm = User(email="admin@skillnexus.in", password_hash=adm_pw, role="ADMIN")
        user_stu_legacy = User(email="demo.student@skillbridge.in", password_hash=stu_pw, role="STUDENT")
        user_emp_legacy = User(email="demo.employer@skillbridge.in", password_hash=emp_pw, role="EMPLOYER")
        user_adm_legacy = User(email="admin@skillbridge.in", password_hash=adm_pw, role="ADMIN")
        db.add_all([user_stu, user_emp, user_adm, user_stu_legacy, user_emp_legacy, user_adm_legacy])
        db.commit()

        skills_data = [
            ("Python", "Backend programming & automation", "IT", 95.0, 1200000, 5200, "HOT"),
            ("React", "Modern component-based frontend framework", "IT", 92.0, 1000000, 4800, "HOT"),
            ("Docker", "Containerization and microservices packaging", "IT", 94.0, 1300000, 4100, "HOT"),
            ("AWS", "Cloud computing infrastructure & services", "IT", 96.0, 1400000, 6200, "HOT"),
            ("Java", "Enterprise backend & distributed computing", "IT", 89.0, 1100000, 5800, "STABLE"),
            ("AutoCAD", "Computer-aided engineering drafting", "Mechanical", 74.0, 600000, 1800, "DECLINING"),
            ("SolidWorks", "3D parametric solid modeling & assemblies", "Mechanical", 87.0, 750000, 2400, "RISING"),
            ("Thermodynamics", "Heat transfer & powertrain cooling analysis", "Mechanical", 78.0, 700000, 1100, "STABLE"),
            ("CAN Bus", "Automotive vehicle network communications protocol", "Mechanical", 93.0, 950000, 3100, "HOT"),
            ("Battery Management", "EV lithium-ion pack BMS architecture & safety", "Mechanical", 97.0, 1350000, 4300, "HOT"),
            ("Circuit Design", "Analog & digital printed circuit design", "Electrical", 86.0, 720000, 2300, "RISING"),
            ("Power Systems", "Grid power distribution & renewable interconnections", "Electrical", 81.0, 780000, 1400, "STABLE"),
            ("PLC Programming", "Industrial programmable logic controllers & SCADA", "Electrical", 91.0, 850000, 3200, "HOT"),
            ("Sensor Fusion", "Multi-sensor telemetry & perception processing", "Electrical", 92.0, 1150000, 2600, "RISING"),
            ("Structural Analysis", "Load calculations & reinforced concrete design", "Civil", 82.0, 680000, 1700, "STABLE"),
            ("Surveying", "GIS & geospatial land boundary surveying", "Civil", 71.0, 540000, 1300, "STABLE"),
            ("Concrete Technology", "Advanced composite & high-tensile concrete", "Civil", 75.0, 620000, 1100, "STABLE"),
            ("Clinical Nursing", "Inpatient care & emergency medical workflows", "Healthcare", 90.0, 520000, 8500, "HOT"),
            ("Patient Care", "Hospital patient monitoring & vital diagnostics", "Healthcare", 93.0, 480000, 10500, "HOT"),
            ("Phlebotomy", "Clinical laboratory blood extraction procedures", "Healthcare", 84.0, 420000, 4600, "STABLE"),
            ("Machine Learning", "Predictive modeling, scikit-learn & PyTorch", "Data Science", 98.0, 1600000, 5400, "HOT"),
            ("SQL", "Relational database analytics & performance tuning", "Data Science", 95.0, 1050000, 8200, "HOT"),
            ("Data Visualization", "Business intelligence reporting & dashboarding", "Data Science", 88.0, 1100000, 3700, "RISING"),
            ("Figma", "UI/UX interface prototyping & design systems", "Design", 91.0, 950000, 3800, "HOT"),
            ("SEO", "Search performance & organic acquisition", "Marketing", 83.0, 650000, 3200, "STABLE")
        ]

        skills_dict = {}
        for name, desc, domain, score, sal, openings, trend in skills_data:
            s = Skill(name=name, description=desc, domain=domain, demand_score=score, median_salary=sal, total_openings=openings, trend=trend)
            db.add(s)
            skills_dict[name] = s
        db.commit()

        for s in skills_dict.values():
            db.add(SkillResource(skill_id=s.id, title=f"{s.name} Video Masterclass", url="https://youtube.com/results?search_query=" + s.name.replace(" ", "+"), resource_type="VIDEO"))
            db.add(SkillResource(skill_id=s.id, title=f"{s.name} NPTEL / Standard Documentation", url="https://nptel.ac.in", resource_type="DOCUMENTATION"))
            db.add(SkillResource(skill_id=s.id, title=f"{s.name} 3D CAD & Technical Models", url="https://grabcad.com/library?query=" + s.name.replace(" ", "+"), resource_type="MODEL"))
            
            for q_idx in range(1, 5):
                db.add(QuizQuestion(
                    skill_id=s.id,
                    question=f"What is a primary best practice when working with {s.name} in industrial systems? (Q{q_idx})",
                    option_a="Standardized validation testing and safety envelope benchmarking",
                    option_b="Arbitrary parameter calibration without telemetry verification",
                    option_c="Disabling error logging to reduce compute cycles",
                    option_d="Bypassing industrial safety specifications",
                    correct_option="A",
                    explanation=f"In production environments, {s.name} requires systematic validation testing and deterministic verification."
                ))
        db.commit()

        courses_data = [
            (
                "CRS-EV-101", "Electric Vehicle Powertrain & BMS Architecture",
                "Comprehensive industrial program covering EV battery pack assembly, thermal run-away prevention, CAN Bus vehicle telemetry, and embedded BMS firmware calibration.",
                "Mechanical", "Advanced Industry-Ready",
                "Battery Management, CAN Bus, Python, Sensor Fusion", 96.5,
                "EV Battery Specialist, Powertrain Integration Engineer, BMS Calibration Lead",
                16, 420, 450, 92.4, 94.0, False, False,
                "AI Analysis: 96.5% direct alignment with Automotive EV clusters in Pune and Chennai. High industry absorption rate with 4,300 active openings."
            ),
            (
                "CRS-ROB-201", "Industrial Robotics & PLC Automation Systems",
                "Advanced hands-on robotics engineering course training students on 6-axis robotic arms, industrial PLC ladder logic, SCADA instrumentation, and cobot safety cells.",
                "Electrical", "Advanced Industry-Ready",
                "PLC Programming, Sensor Fusion, Circuit Design, SolidWorks", 94.0,
                "Automation Control Engineer, Robotics Technician, Mechatronics Lead",
                14, 380, 400, 89.6, 91.5, False, False,
                "AI Analysis: 94.0% industry fit. Crucial for Industry 4.0 adoption in precision tooling and assembly plants."
            ),
            (
                "CRS-AI-301", "Applied Machine Learning & Computer Vision",
                "Engineering curriculum focusing on deep learning pipelines, edge computer vision deployment, quality inspection modeling, and PyTorch production inference.",
                "Data Science", "Advanced Industry-Ready",
                "Machine Learning, Python, SQL, Docker", 97.2,
                "ML Engineer, Computer Vision Specialist, Data Scientist",
                20, 610, 650, 93.8, 95.0, False, False,
                "AI Analysis: Exceptional industry alignment. High median starting packages across aerospace, auto, and IT."
            ),
            (
                "CRS-CLD-102", "Cloud Infrastructure & DevOps Engineering",
                "Enterprise cloud architecture covering container orchestration, CI/CD automated test pipelines, infrastructure-as-code, and resilient AWS configurations.",
                "IT", "Intermediate",
                "AWS, Docker, Python, SQL", 93.5,
                "DevOps Engineer, Cloud Solutions Architect, Platform SRE",
                12, 540, 550, 91.2, 92.0, False, False,
                "AI Analysis: Matches current multi-cloud enterprise demand with 6,200 vacancies nationally."
            ),
            (
                "CRS-CNC-401", "Precision CNC Multi-Axis Machining & Tooling",
                "Hands-on workshop curriculum for 5-axis CNC programming, CAD-to-CAM translation, G-code optimization, and micro-tolerance component manufacturing.",
                "Mechanical", "Intermediate",
                "SolidWorks, AutoCAD, Sensor Fusion", 86.0,
                "CNC Specialist, Precision Machinist, Production Supervisor",
                10, 310, 350, 84.5, 87.0, False, False,
                "AI Analysis: Steady industrial manufacturing demand across heavy engineering and defense corridors."
            ),
            (
                "CRS-SOL-205", "Solar PV Design & Microgrid Installation",
                "Renewable energy engineering covering grid-tie solar inverters, PV array load calculation, storage battery sizing, and MNRE regulatory compliance.",
                "Electrical", "Intermediate",
                "Power Systems, Circuit Design, AutoCAD", 88.0,
                "Solar Project Engineer, Grid Technician, Renewable Energy Specialist",
                12, 290, 320, 85.0, 88.0, False, False,
                "AI Analysis: Critical for national green energy transition targets; regional shortage of certified solar site engineers."
            ),
            (
                "CRS-HLT-501", "Critical Patient Monitoring & Medical Devices",
                "Clinical healthcare training for advanced ICU telemetry equipment, hemodialysis machines, physiological signal diagnostics, and patient safety protocols.",
                "Healthcare", "Intermediate",
                "Patient Care, Clinical Nursing, Phlebotomy", 91.5,
                "ICU Medical Technician, Clinical Care Specialist, Biomedical Technologist",
                16, 490, 500, 94.2, 96.0, False, False,
                "AI Analysis: Extremely high societal and clinical demand across metropolitan hospital networks."
            ),
            (
                "CRS-CAD-103", "2D Legacy Drafting & Blueprints",
                "Traditional 2D manual drafting concepts using basic geometry plotting tools.",
                "Mechanical", "Foundational",
                "AutoCAD", 48.0,
                "Draftsman, Blueprint Tracer",
                8, 650, 400, 42.0, 50.0, True, False,
                "AI Analysis: CRITICAL: Curriculum is outdated. 92% of industries require 3D parametric modelling and BIM. Recommended for immediate sunsetting and pivot to SolidWorks/BMS."
            ),
            (
                "CRS-DAT-104", "Basic Data Entry & Office Automation",
                "Basic alphanumeric input, file indexing, and standalone spreadsheet recording.",
                "Data Science", "Foundational",
                "SQL", 32.0,
                "Data Entry Clerk, Office Assistant",
                6, 1400, 500, 31.0, 38.0, True, True,
                "AI Analysis: CRITICAL OVERSUPPLY: 1,400 students trained per cohort against fewer than 200 regional openings. AI automated transcription has eliminated entry-level roles."
            ),
            (
                "CRS-BPO-101", "Standard Voice Telecalling Operations",
                "Basic call script reading and customer queue management.",
                "Marketing", "Foundational",
                "Content Marketing", 39.0,
                "Telecaller, Customer Service Agent",
                6, 1200, 450, 41.0, 45.0, False, True,
                "AI Analysis: OVERSUPPLY: Capacity exceeds demand by 260%. Recommend reducing seats by 60% and re-allocating funding to Cloud & Digital Marketing."
            )
        ]

        course_entities = {}
        for code_val, title, desc, domain, depth, skills_offered, align, roles, dur, enr, cap, plac, sat, outd, over, ai_text in courses_data:
            c = Course(
                course_code=code_val, title=title, description=desc, domain=domain, depth_level=depth,
                skills_offered=skills_offered, industry_demand_alignment=align, related_job_roles=roles,
                duration_weeks=dur, enrolled_count=enr, target_capacity=cap, placement_rate=plac,
                employer_satisfaction=sat, is_outdated=outd, is_oversupplied=over, ai_analysis=ai_text
            )
            db.add(c)
            course_entities[code_val] = c
        db.commit()

        stu = Student(
            user_id=user_stu.id, full_name="Demo Student", dob="2001-08-15", gender="Male",
            phone="+91 98765 43210", profile_complete_pct=85.0
        )
        db.add(stu)
        db.commit()

        loc1 = StudentLocation(student_id=stu.id, city="Pune", state="Maharashtra", pincode="411001", latitude=18.5204, longitude=73.8567, is_primary=True, display_order=1)
        loc2 = StudentLocation(student_id=stu.id, city="Mumbai", state="Maharashtra", pincode="400001", latitude=19.0760, longitude=72.8777, is_primary=False, display_order=2)
        loc3 = StudentLocation(student_id=stu.id, city="Bengaluru", state="Karnataka", pincode="560001", latitude=12.9716, longitude=77.5946, is_primary=False, display_order=3)
        db.add_all([loc1, loc2, loc3])

        edu = StudentEducation(student_id=stu.id, degree="B.Tech", field_of_study="Mechanical & Automation", institution="College of Engineering Pune (COEP)", graduation_year=2024)
        db.add(edu)

        db.add_all([
            StudentInterest(student_id=stu.id, domain="Mechanical"),
            StudentInterest(student_id=stu.id, domain="IT"),
            StudentInterest(student_id=stu.id, domain="Electrical")
        ])

        sc1 = StudentCourse(
            student_id=stu.id, course_id=course_entities["CRS-EV-101"].id,
            completion_date="2024-05-20", grade="Distinction (A+)",
            gained_skills="Battery Management, CAN Bus, Python, Sensor Fusion"
        )
        sc2 = StudentCourse(
            student_id=stu.id, course_id=course_entities["CRS-ROB-201"].id,
            completion_date="2024-11-15", grade="Certified (A)",
            gained_skills="PLC Programming, Sensor Fusion, SolidWorks"
        )
        db.add_all([sc1, sc2])

        cert = StudentCertificate(
            student_id=stu.id, title="Certified SolidWorks Professional (CSWP)",
            issuer="Dassault Syst?mes / MSDE Skill Council", issue_date="2024-06-10",
            credential_id="CSWP-IND-2024-9921", credential_url="https://verify.dassault.com/cswp/9921",
            gained_skills="SolidWorks, AutoCAD"
        )
        db.add(cert)

        for skill_name, prof in [
            ("Python", "INTERMEDIATE"),
            ("CAN Bus", "EXPERT"),
            ("Battery Management", "INTERMEDIATE"),
            ("PLC Programming", "BEGINNER"),
            ("SolidWorks", "EXPERT"),
            ("Sensor Fusion", "INTERMEDIATE")
        ]:
            if skill_name in skills_dict:
                db.add(StudentSkill(student_id=stu.id, skill_id=skills_dict[skill_name].id, proficiency=prof))
        db.commit()

        emp = Employer(
            user_id=user_emp.id, company_name="NexGen Mobility Technologies", industry="Automotive",
            sector="Electric Vehicles & Autonomous Systems", website="https://nexgenmobility.com",
            city="Pune", state="Maharashtra",
            description="Leading automotive tier-1 supplier engineering high-efficiency EV powertrains and robotics assembly cells.",
            logo_url=""
        )
        db.add(emp)
        db.commit()

        other_employers = [
            ("Tata Motors EV Division", "Automotive", "Electric Vehicles", "Pune", "Maharashtra", "Pioneering electric mobility in India with passenger and commercial EV fleets."),
            ("Mahindra Electric & Tech", "Automotive", "Automotive Manufacturing", "Pune", "Maharashtra", "Pioneers of commercial electric mobility and clean energy transport systems."),
            ("Larsen & Toubro Automation", "Electrical", "Industrial Automation", "Chennai", "Tamil Nadu", "Heavy engineering and EPC leader executing turnkey automated smart facilities."),
            ("Apollo Health City", "Healthcare", "Super Specialty Healthcare", "Chennai", "Tamil Nadu", "Premier medical and healthcare institution providing multi-disciplinary patient diagnostics."),
            ("Infosys AI Labs", "IT", "Cloud & AI Engineering", "Bengaluru", "Karnataka", "Global next-generation digital services and consulting powerhouse."),
            ("Siemens Smart Infrastructure", "Electrical", "Power & Industrial Systems", "Mumbai", "Maharashtra", "Technology company focused on industry, infrastructure, transport, and grid power."),
            ("Bosch Engineering India", "Automotive", "Automotive Embedded Systems", "Bengaluru", "Karnataka", "Global supplier of automotive technology, driver assistance, and IoT industrial solutions.")
        ]

        employer_entities = {"NexGen Mobility Technologies": emp}
        for cname, ind, sect, city, state, desc in other_employers:
            clean_email = "hr@" + cname.lower().replace(" ", "") + ".com"
            u = User(email=clean_email, password_hash=emp_pw, role="EMPLOYER")
            db.add(u)
            db.commit()
            e = Employer(user_id=u.id, company_name=cname, industry=ind, sector=sect, city=city, state=state, description=desc)
            db.add(e)
            employer_entities[cname] = e
        db.commit()

        jobs_seed = [
            (
                "NexGen Mobility Technologies", "Senior EV Battery Integration Engineer",
                "Design, test, and calibrate high-voltage battery modules, thermal management enclosures, and CAN bus vehicle telemetry pipelines.",
                "Electric Vehicles", "FULL_TIME", "INTERMEDIATE", 2, 900000, 1400000, 4,
                "Pune", "Maharashtra", 18.5204, 73.8567,
                ["Battery Management", "CAN Bus", "Python", "Sensor Fusion"]
            ),
            (
                "Tata Motors EV Division", "Robotics Line Automation Specialist",
                "Program and maintain 6-axis welding and assembly robots, automate PLC cycle triggers, and supervise robotic cell vision inspection.",
                "Industrial Automation", "FULL_TIME", "INTERMEDIATE", 1, 750000, 1200000, 6,
                "Pune", "Maharashtra", 18.5204, 73.8567,
                ["PLC Programming", "SolidWorks", "Circuit Design"]
            ),
            (
                "Mahindra Electric & Tech", "Powertrain Simulation & CAD Modeler",
                "Build 3D parametric CAD models of vehicle chassis, run finite element stress simulations, and collaborate with prototyping teams.",
                "Automotive Manufacturing", "FULL_TIME", "BEGINNER", 0, 600000, 950000, 5,
                "Pune", "Maharashtra", 18.5204, 73.8567,
                ["SolidWorks", "AutoCAD", "Thermodynamics"]
            ),
            (
                "Siemens Smart Infrastructure", "Industrial SCADA & Automation Engineer",
                "Lead factory automation commissioning, program Siemens S7 PLCs, configure SCADA telemetry, and design power distribution systems.",
                "Power Systems", "FULL_TIME", "ADVANCED", 3, 1100000, 1600000, 3,
                "Mumbai", "Maharashtra", 19.0760, 72.8777,
                ["PLC Programming", "Power Systems", "Circuit Design"]
            ),
            (
                "Infosys AI Labs", "Edge AI & Perception Systems Developer",
                "Develop low-latency machine learning inference pipelines on embedded microprocessors for autonomous robotic navigation.",
                "AI & Cloud", "FULL_TIME", "INTERMEDIATE", 2, 1200000, 1800000, 8,
                "Bengaluru", "Karnataka", 12.9716, 77.5946,
                ["Python", "Machine Learning", "Docker", "AWS"]
            ),
            (
                "Bosch Engineering India", "Automotive Telematics & Firmware Engineer",
                "Develop embedded firmware drivers for electronic control units (ECUs), CAN bus packet filtering, and sensor data acquisition.",
                "Automotive Embedded", "FULL_TIME", "INTERMEDIATE", 2, 1000000, 1500000, 5,
                "Bengaluru", "Karnataka", 12.9716, 77.5946,
                ["CAN Bus", "Circuit Design", "Python", "Sensor Fusion"]
            ),
            (
                "Larsen & Toubro Automation", "Mechatronics & Assembly Automation Engineer",
                "Design heavy industrial handling systems, integrate hydraulic actuators with PLC logic, and conduct safety validation audits.",
                "Industrial Automation", "FULL_TIME", "INTERMEDIATE", 2, 800000, 1300000, 4,
                "Chennai", "Tamil Nadu", 13.0827, 80.2707,
                ["PLC Programming", "SolidWorks", "Power Systems"]
            ),
            (
                "Apollo Health City", "Biomedical Equipment Instrumentation Specialist",
                "Maintain clinical telemetry systems, calibrate digital patient monitors, and oversee hospital medical instrument maintenance.",
                "Healthcare Tech", "FULL_TIME", "BEGINNER", 1, 550000, 800000, 7,
                "Chennai", "Tamil Nadu", 13.0827, 80.2707,
                ["Patient Care", "Clinical Nursing", "Circuit Design"]
            )
        ]

        for emp_name, title, desc, sector, jtype, prof, exp, smin, smax, vac, city, state, lat, lng, req_skills in jobs_seed:
            emp_obj = employer_entities.get(emp_name, emp)
            j = Job(
                employer_id=emp_obj.id, title=title, description=desc, sector=sector,
                job_type=jtype, proficiency_required=prof, experience_years=exp,
                salary_min=smin, salary_max=smax, openings_count=vac,
                city=city, state=state, latitude=lat, longitude=lng, is_active=True
            )
            db.add(j)
            db.commit()

            for sk_name in req_skills:
                if sk_name in skills_dict:
                    db.add(JobSkill(job_id=j.id, skill_id=skills_dict[sk_name].id, is_required=True))
        db.commit()

        districts_seed = [
            ("Maharashtra", "Pune", "Automotive & EV", 94.0, 3200, 2400, "CRITICAL_SHORTAGE", "Battery Management & CAN Bus", 4800, "Build New Advanced EV Centre & Expand Capacity by 1,600 Seats"),
            ("Karnataka", "Bengaluru", "Cloud & AI Engineering", 97.0, 5200, 3900, "CRITICAL_SHORTAGE", "Edge AI & Cloud Architecture", 7500, "Commission 2 New High-Tech IT Hubs & Double Trainer Allocation"),
            ("Tamil Nadu", "Chennai", "Automotive & Robotics", 89.0, 4100, 1800, "HIGH_DEMAND", "Industrial Robotics & PLC", 5500, "Expand Existing Tooling Centres in Oragadam Automotive Cluster"),
            ("Haryana", "Gurugram", "Supply Chain & AI", 86.0, 2900, 1400, "HIGH_DEMAND", "Data Analytics & Cloud DevOps", 4000, "Establish Specialized Logistics Analytics Training Wing"),
            ("Maharashtra", "Mumbai", "Fintech & Electrical", 84.0, 4600, 600, "BALANCED", "Full-Stack Engineering & SCADA", 5000, "Maintain Current Capacity & Upgrade Digital Instrumentation Labs"),
            ("Gujarat", "Ahmedabad", "Chemical Automation & Solar", 87.0, 3300, 1500, "HIGH_DEMAND", "PLC Automation & Solar PV Design", 4500, "Build New Green Energy Vocational Skill Institute"),
            ("Uttar Pradesh", "Kanpur", "Traditional Leather & Drafting", 44.0, 3800, -1600, "OVERSUPPLY", "Basic 2D Drafting (Legacy)", 2200, "Reduce Existing Capacity by 40% & Modernize Labs to CNC / Automation"),
            ("Bihar", "Patna", "Basic Data Operations", 38.0, 3400, -1800, "OVERSUPPLY", "Basic Data Entry", 1600, "Phase Out Standalone Data Entry; Reallocate 1,500 Seats to Solar & Telecom")
        ]

        for st, dist, sect, d_idx, cap, short, status, top_sk, rec_seats, rec_act in districts_seed:
            db.add(DistrictIntelligence(
                state=st, district=dist, primary_sector=sect, demand_index=d_idx,
                current_capacity=cap, shortage_deficit=short, status=status,
                top_demand_skill=top_sk, recommended_seats=rec_seats, recommended_action=rec_act
            ))
        db.commit()

        trainers_seed = [
            ("Prof. Anand Kulkarni", "anand.k@pune-tech.gov.in", "Pune", "Maharashtra", "EV & Automotive", "Battery Management, CAN Bus, Thermodynamics", 92.0, False, None),
            ("Suresh Deshmukh", "suresh.d@pune-poly.gov.in", "Pune", "Maharashtra", "Mechanical Drafting", "AutoCAD 2D, Machine Drawing", 61.0, True, "Advanced 3D Parametric Modeling & EV Chassis Design (CRS-EV-101)"),
            ("Priya Sundaram", "priya.s@chennai-it.gov.in", "Chennai", "Tamil Nadu", "Robotics & Automation", "PLC Programming, Sensor Fusion", 89.0, False, None),
            ("Ramesh Kumar", "ramesh.k@kanpur-iti.gov.in", "Kanpur", "Uttar Pradesh", "Conventional Machining", "Lathe, Shaper, Milling", 54.0, True, "Multi-Axis CNC Programming & CAM Integration (CRS-CNC-401)"),
            ("Kavita Nair", "kavita.n@bengaluru-skill.gov.in", "Bengaluru", "Karnataka", "Data Science & AI", "Python, Machine Learning, SQL", 94.0, False, None),
            ("Deepak Sharma", "deepak.s@gurugram-poly.gov.in", "Gurugram", "Haryana", "Office Computing", "Word Processing, Spreadsheets", 48.0, True, "Cloud Infrastructure & Business Intelligence Analytics (CRS-CLD-102)"),
            ("Manoj Patel", "manoj.p@ahmedabad-skill.gov.in", "Ahmedabad", "Gujarat", "Solar Energy", "Solar PV Design, Power Systems", 88.0, False, None)
        ]

        for name, email, dist, st, dom, sk, score, needs, rec in trainers_seed:
            db.add(Trainer(
                name=name, email=email, district=dist, state=st, domain=dom,
                skills=sk, capability_score=score, needs_upskilling=needs, recommended_upskilling=rec
            ))
        db.commit()

        curriculum_updates_seed = [
            ("CRS-EV-101", "Add Solid-State Lithium Battery Diagnostics Module", "Society of Indian Automobile Manufacturers (SIAM)", "Include 24 hours of hands-on fault tracing on solid-state battery cells and high-speed CAN-FD protocols.", "Rapid commercialization of 800V fast-charging passenger EV architectures.", "PENDING"),
            ("CRS-ROB-201", "Integrate Collaborative Robotics (Cobot) Safety Protocols", "Robotics Society of India", "Add ISO/TS 15066 collaborative robot speed and separation monitoring standards.", "Widespread deployment of human-robot collaborative workstations in Tier-1 assembly lines.", "APPROVED"),
            ("CRS-CAD-103", "Deprecate 2D Manual Blueprinting; Mandate 3D Parametric Assemblies", "National Skill Development Council (NSDC)", "Replace weeks 4-8 with SolidWorks sheet metal design and generative toolpath creation.", "Industry feedback shows 2D standalone drafting graduates have under 42% placement.", "PENDING"),
            ("CRS-AI-301", "Incorporate Generative AI Prompt Engineering for Code Refactoring", "NASSCOM Tech Council", "Add 15 hours of automated testing and code generation using local LLM models.", "Accelerates developer productivity across software engineering cohorts.", "REJECTED")
        ]

        for code_val, title, sub, prop, just, stat in curriculum_updates_seed:
            db.add(CurriculumUpdate(
                course_code=code_val, title=title, submitted_by=sub, proposed_changes=prop,
                industry_justification=just, status=stat
            ))
        db.commit()

        feedbacks_seed = [
            ("Demo Student", "EV Powertrain Integration", 5, True, "None - exceptional foundational CAN Bus knowledge", "Include more thermal modeling simulations"),
            ("Rahul Sharma", "Industrial Robotics Automation", 4, True, "PLC Ladder troubleshooting speed under fault pressure", "Include live factory SCADA troubleshooting simulations"),
            ("Neha Verma", "Cloud DevOps Trainee", 5, True, "None - ready for immediate deployment", "Add multi-region Kubernetes cluster redundancy scenarios"),
            ("Amit Joshi", "Mechanical CAD Drafter", 2, False, "Lacked 3D parametric assembly experience; only knew 2D", "Replace 2D drafting with SolidWorks & GD&T tolerance analysis"),
            ("Sneha Patil", "Solar PV Site Technician", 4, True, "Inverter firmware update safety checks", "Introduce microgrid battery load balancing")
        ]

        for cname, crole, rat, ready, miss, sugg in feedbacks_seed:
            db.add(CandidateFeedback(
                employer_id=emp.id, candidate_name=cname, course_or_role=crole,
                rating=rat, job_ready=ready, missing_skills=miss, suggested_skills=sugg
            ))
        db.commit()

        consultations_seed = [
            (emp.id, "Automotive", "High-Voltage Safety Certification Standards", "Urgent need for certified 800V safety training before students enter shop floors.", "HIGH"),
            (emp.id, "Industrial Robotics", "Standardization of Robot Operating System (ROS 2)", "Transition curriculum from ROS 1 to ROS 2 Humble for long-term support.", "MEDIUM")
        ]
        for eid, sect, top, txt, prio in consultations_seed:
            db.add(IndustryConsultation(employer_id=eid, sector=sect, topic=top, feedback_text=txt, priority=prio))
        db.commit()

        institutes_seed = [
            ("Government Polytechnic Pune", "Pune", "Maharashtra", "EV & Automotive Engineering", 450, 91.5, 4.8, "principal@gppune.ac.in"),
            ("Institute of Industrial Robotics Chennai", "Chennai", "Tamil Nadu", "Robotics & Factory Automation", 320, 88.0, 4.7, "admissions@iir-chennai.edu.in"),
            ("Karnataka Advanced Tech Skill Academy", "Bengaluru", "Karnataka", "Cloud Computing & AI", 600, 93.2, 4.9, "contact@katsa.karnataka.gov.in"),
            ("National Institute of Tooling & Machining", "Ahmedabad", "Gujarat", "Precision Tooling & CNC Machining", 280, 86.4, 4.6, "info@nitm-gujarat.edu.in"),
            ("Centre for Renewable Energy Excellence", "Pune", "Maharashtra", "Solar & Microgrid Engineering", 240, 85.0, 4.5, "contact@cree-india.org")
        ]
        for iname, idist, ist, ifocus, igrad, iplace, irate, imail in institutes_seed:
            db.add(TrainingInstitute(
                name=iname, district=idist, state=ist, focus_domain=ifocus,
                annual_graduates=igrad, placement_rate=iplace, rating=irate, contact_email=imail
            ))
        db.commit()

        print("Database successfully seeded with complete Admin, Student, Employer, Courses, Districts, Trainers, and Industry modules!")
    finally:
        db.close()

if __name__ == "__main__":
    seed(force_reseed=True)
