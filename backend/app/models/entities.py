from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # STUDENT, EMPLOYER, ADMIN, TRAINER
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = 'students'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    full_name = Column(String)
    dob = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    profile_complete_pct = Column(Float, default=0.0)

class StudentLocation(Base):
    __tablename__ = 'student_locations'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    city = Column(String)
    state = Column(String)
    pincode = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_primary = Column(Boolean, default=False)
    display_order = Column(Integer)

class StudentEducation(Base):
    __tablename__ = 'student_education'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    degree = Column(String)
    field_of_study = Column(String)
    institution = Column(String)
    graduation_year = Column(Integer)

class StudentSkill(Base):
    __tablename__ = 'student_skills'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    skill_id = Column(Integer, ForeignKey('skills.id'))
    proficiency = Column(String)

class StudentInterest(Base):
    __tablename__ = 'student_interests'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    domain = Column(String)

class StudentResume(Base):
    __tablename__ = 'student_resumes'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'), unique=True)
    file_path = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    parsed_at = Column(DateTime, nullable=True)

class Course(Base):
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True)
    course_code = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(Text)
    domain = Column(String)
    depth_level = Column(String)
    skills_offered = Column(String)
    industry_demand_alignment = Column(Float)
    related_job_roles = Column(String)
    duration_weeks = Column(Integer, default=12)
    enrolled_count = Column(Integer, default=0)
    target_capacity = Column(Integer, default=500)
    placement_rate = Column(Float, default=75.0)
    employer_satisfaction = Column(Float, default=85.0)
    is_outdated = Column(Boolean, default=False)
    is_oversupplied = Column(Boolean, default=False)
    ai_analysis = Column(Text, nullable=True)

class CourseEnrollment(Base):
    __tablename__ = 'course_enrollments'
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    student_id = Column(Integer, ForeignKey('students.id'), nullable=True)
    full_name = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    education = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    motivation = Column(Text, nullable=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default='PENDING')  # PENDING, CONFIRMED, REJECTED, REVOKED
    revocation_reason = Column(Text, nullable=True)

class StudentCourse(Base):
    __tablename__ = 'student_courses'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    course_id = Column(Integer, ForeignKey('courses.id'))
    completion_date = Column(String)
    grade = Column(String, default="Certified")
    gained_skills = Column(String)

class StudentCertificate(Base):
    __tablename__ = 'student_certificates'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    title = Column(String)
    issuer = Column(String)
    issue_date = Column(String)
    credential_id = Column(String)
    credential_url = Column(String, nullable=True)
    gained_skills = Column(String)

class Employer(Base):
    __tablename__ = 'employers'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    company_name = Column(String)
    industry = Column(String)
    sector = Column(String, nullable=True)
    website = Column(String, nullable=True)
    city = Column(String)
    state = Column(String)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True)
    employer_id = Column(Integer, ForeignKey('employers.id'))
    company_name = Column(String, nullable=True)
    apply_url = Column(String, nullable=True)
    # Source tracking for deduplication and freshness
    source = Column(String, nullable=True)           # maharashtra_industry | remotive | jobicy | employer
    source_job_id = Column(String, nullable=True)    # unique ID from external source
    fetched_at = Column(DateTime, nullable=True)     # when first ingested
    last_seen_at = Column(DateTime, nullable=True)   # updated on every sync pass
    title = Column(String)
    description = Column(Text)
    sector = Column(String, nullable=True)
    job_type = Column(String)
    proficiency_required = Column(String, default="INTERMEDIATE")
    experience_years = Column(Integer, default=1)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    openings_count = Column(Integer, default=1)
    city = Column(String)
    state = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class JobSkill(Base):
    __tablename__ = 'job_skills'
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey('jobs.id'))
    skill_id = Column(Integer, ForeignKey('skills.id'))
    is_required = Column(Boolean, default=True)

class SavedJob(Base):
    __tablename__ = 'saved_jobs'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    job_id = Column(Integer, ForeignKey('jobs.id'))
    saved_at = Column(DateTime, default=datetime.utcnow)

class JobAlert(Base):
    __tablename__ = 'job_alerts'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    title = Column(String, nullable=True)
    skills = Column(String, nullable=True)       # comma-separated skill names
    location = Column(String, nullable=True)     # city or state
    job_type = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Skill(Base):
    __tablename__ = 'skills'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(Text)
    domain = Column(String)
    demand_score = Column(Float)
    median_salary = Column(Integer)
    total_openings = Column(Integer, default=0)
    trend = Column(String)

class SkillResource(Base):
    __tablename__ = 'skill_resources'
    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey('skills.id'))
    title = Column(String)
    url = Column(String)
    resource_type = Column(String)

class QuizQuestion(Base):
    __tablename__ = 'quiz_questions'
    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey('skills.id'))
    question = Column(String)
    option_a = Column(String)
    option_b = Column(String)
    option_c = Column(String)
    option_d = Column(String)
    correct_option = Column(String)
    explanation = Column(String, nullable=True)

class QuizAttempt(Base):
    __tablename__ = 'quiz_attempts'
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    skill_id = Column(Integer, ForeignKey('skills.id'))
    score = Column(Integer)
    total = Column(Integer)
    passed = Column(Boolean)
    attempted_at = Column(DateTime, default=datetime.utcnow)

class DistrictIntelligence(Base):
    __tablename__ = 'district_intelligence'
    id = Column(Integer, primary_key=True)
    state = Column(String)
    district = Column(String)
    primary_sector = Column(String)
    demand_index = Column(Float)
    current_capacity = Column(Integer)
    shortage_deficit = Column(Integer)
    status = Column(String)
    top_demand_skill = Column(String)
    recommended_seats = Column(Integer)
    recommended_action = Column(String)

class Trainer(Base):
    __tablename__ = 'trainers'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    trainer_code = Column(String, nullable=True)  # TRN-001
    name = Column(String)
    email = Column(String, unique=True)
    district = Column(String)
    state = Column(String)
    domain = Column(String)
    skills = Column(String)
    capability_score = Column(Float)
    needs_upskilling = Column(Boolean, default=False)
    recommended_upskilling = Column(String, nullable=True)
    courses_assigned = Column(String, nullable=True)  # comma-sep course codes

class CurriculumUpdate(Base):
    __tablename__ = 'curriculum_updates'
    id = Column(Integer, primary_key=True)
    course_code = Column(String)
    title = Column(String)
    submitted_by = Column(String)
    proposed_changes = Column(Text)
    industry_justification = Column(Text)
    status = Column(String, default="PENDING")
    submitted_at = Column(DateTime, default=datetime.utcnow)

class CandidateFeedback(Base):
    __tablename__ = 'candidate_feedbacks'
    id = Column(Integer, primary_key=True)
    employer_id = Column(Integer, ForeignKey('employers.id'))
    candidate_name = Column(String)
    course_or_role = Column(String)
    rating = Column(Integer)
    job_ready = Column(Boolean)
    missing_skills = Column(String)
    suggested_skills = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class IndustryConsultation(Base):
    __tablename__ = 'industry_consultations'
    id = Column(Integer, primary_key=True)
    employer_id = Column(Integer, ForeignKey('employers.id'))
    sector = Column(String)
    topic = Column(String)
    feedback_text = Column(Text)
    priority = Column(String, default="MEDIUM")
    created_at = Column(DateTime, default=datetime.utcnow)

class TrainingInstitute(Base):
    __tablename__ = 'training_institutes'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    district = Column(String)
    state = Column(String)
    focus_domain = Column(String)
    annual_graduates = Column(Integer)
    placement_rate = Column(Float)
    rating = Column(Float)
    contact_email = Column(String)

class SystemSetting(Base):
    __tablename__ = 'system_settings'
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

