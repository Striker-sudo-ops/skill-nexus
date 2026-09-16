# Database & ER Design: Smart Skill Intelligence Platform

## 1. Entity Relationship Overview

The database design adheres to strict relational integrity, indexed foreign keys, audit tracking, and vector-enabled semantic search.

### Core Relational Hierarchy
```
State ──< District ──< TrainingProvider ──< Trainer ──< TrainerSkill / TrainerCertification / TrainerModule
                   ├──< Industry ──< Job ──< JobSkill
                   └──< Student ──< StudentSkill / Enrollment / AssessmentResult / SkillProof
```

---

## 2. Table Specifications & Relationships

### 2.1 Identity, Users & Roles
- **`roles`**: `id` (PK), `name` (`ADMIN`, `TRAINING_PROVIDER`, `INDUSTRY`, `STUDENT`), `description`.
  *(Note: Trainer is intentionally excluded from the roles table).*
- **`users`**: `id` (PK, UUID), `email` (unique, indexed), `hashed_password`, `role_id` (FK -> `roles.id`), `full_name`, `phone`, `is_active`, `created_at`, `updated_at`.
- **`organizations`**: `id` (PK, UUID), `name`, `type` (`GOVERNMENT`, `TRAINING_PROVIDER`, `INDUSTRY`), `registration_number`, `created_at`.
- **`audit_logs`**: `id` (PK, UUID), `user_id` (FK -> `users.id`), `action`, `entity_type`, `entity_id`, `details` (JSONB), `timestamp`.
- **`notifications`**: `id` (PK, UUID), `user_id` (FK -> `users.id`), `title`, `message`, `type`, `read`, `created_at`.

### 2.2 Geography & Regional Infrastructure
- **`states`**: `id` (PK), `code`, `name`.
- **`districts`**: `id` (PK), `state_id` (FK -> `states.id`), `name`, `latitude`, `longitude`, `industrial_zone_rating`.

### 2.3 Training Providers & Internal Trainer Hierarchy
- **`training_providers`**: `id` (PK, UUID), `user_id` (FK -> `users.id`), `name`, `code`, `district_id` (FK -> `districts.id`), `address`, `established_year`, `accreditation_grade`, `total_student_capacity`, `website`, `contact_person`, `created_at`.
- **`trainers`**:
  - `id` (PK, UUID)
  - `training_provider_id` (FK -> `training_providers.id`, indexed, cascading)
  - `name`, `email`, `phone`, `qualification`, `experience_years`, `specialization`, `availability_status` (`AVAILABLE`, `ASSIGNED`, `ON_LEAVE`), `created_at`, `updated_at`.
  - **Constraint:** Strictly scoped to one `training_provider`.
- **`trainer_skills`**: `id` (PK, UUID), `trainer_id` (FK -> `trainers.id`), `skill_id` (FK -> `skills.id`), `proficiency_level` (1-100), `years_experience`, `verified` (bool).
- **`trainer_certifications`**: `id` (PK, UUID), `trainer_id` (FK -> `trainers.id`), `certification_name`, `issuing_organization`, `issue_date`, `expiry_date`, `verification_status`.
- **`trainer_courses`**: `trainer_id` (FK), `course_id` (FK).
- **`trainer_batches`**: `trainer_id` (FK), `batch_id` (FK).
- **`trainer_modules`**: `trainer_id` (FK), `curriculum_module_id` (FK).

### 2.4 Equipment & Lab Infrastructure
- **`equipment`**: `id` (PK, UUID), `name`, `code`, `category` (e.g., `EV_DIAGNOSTICS`, `CNC_MACHINERY`, `ROBOTICS_ARM`), `description`, `standard_cost_inr`.
- **`training_provider_equipment`**: `id` (PK, UUID), `training_provider_id` (FK -> `training_providers.id`), `equipment_id` (FK -> `equipment.id`), `total_units`, `operational_units`, `under_maintenance_units`, `utilization_rate_pct`, `last_inspection_date`.

### 2.5 Industry, Locations & Jobs
- **`industries`**: `id` (PK, UUID), `user_id` (FK -> `users.id`), `company_name`, `cin_number`, `sector` (e.g., `Automotive & EV`, `Renewable Energy`, `IT & Cybersecurity`, `Electronics`), `website`, `created_at`.
- **`industry_locations`**: `id` (PK, UUID), `industry_id` (FK -> `industries.id`), `district_id` (FK -> `districts.id`), `address`, `headquarters` (bool).
- **`job_roles`**: `id` (PK, UUID), `title`, `sector`, `code`, `soc_code`, `description`, `growth_outlook` (`DECLINING`, `STABLE`, `HIGH_GROWTH`, `EMERGING`).
- **`jobs`**: `id` (PK, UUID), `industry_id` (FK -> `industries.id`), `job_role_id` (FK -> `job_roles.id`), `title`, `description`, `vacancies`, `min_experience_years`, `min_education`, `min_salary`, `max_salary`, `district_id` (FK -> `districts.id`), `status` (`OPEN`, `FILLED`, `CLOSED`), `posted_at`.
- **`job_skills`**: `id` (PK, UUID), `job_id` (FK -> `jobs.id`), `skill_id` (FK -> `skills.id`), `required_proficiency` (1-100), `is_mandatory` (bool).

### 2.6 Skill Taxonomy & Market Demand
- **`skill_categories`**: `id` (PK, UUID), `name`, `sector`, `description`.
- **`skills`**: `id` (PK, UUID), `category_id` (FK -> `skill_categories.id`), `name`, `normalized_name`, `aliases` (TEXT[]), `description`, `embedding` (VECTOR(384) or JSON fallback), `trend_status` (`DECLINING`, `STABLE`, `RISING_RAPIDLY`, `EMERGING`).
- **`skill_demand`**: `id` (PK, UUID), `skill_id` (FK -> `skills.id`), `district_id` (FK -> `districts.id`), `demand_index` (1-100), `active_job_count`, `reported_shortage_severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `recorded_at`.
- **`demand_forecasts`**: `id` (PK, UUID), `skill_id` (FK -> `skills.id`), `district_id` (FK -> `districts.id`), `forecast_year`, `forecast_quarter`, `projected_demand_index`, `confidence_interval_low`, `confidence_interval_high`.

### 2.7 Courses, Curriculum & Modules
- **`courses`**: `id` (PK, UUID), `training_provider_id` (FK -> `training_providers.id`), `name`, `code`, `sector`, `duration_weeks`, `total_hours`, `practical_hours`, `is_active`.
- **`curricula`**: `id` (PK, UUID), `course_id` (FK -> `courses.id`), `version`, `title`, `is_current`, `alignment_score` (1-100), `created_at`.
- **`curriculum_modules`**: `id` (PK, UUID), `curriculum_id` (FK -> `curricula.id`), `title`, `hours_theory`, `hours_practical`, `learning_outcomes`, `sequence_order`, `status` (`ACTIVE`, `PROPOSED`, `OUTDATED`, `RETIRED`).
- **`curriculum_skills`**: `id` (PK, UUID), `curriculum_module_id` (FK -> `curriculum_modules.id`), `skill_id` (FK -> `skills.id`), `coverage_depth` (`INTRODUCTORY`, `INTERMEDIATE`, `ADVANCED`), `target_proficiency` (1-100).
- **`curriculum_proposals`**: `id` (PK, UUID), `training_provider_id` (FK -> `training_providers.id`), `curriculum_id` (FK -> `curricula.id`), `title`, `summary_of_changes`, `projected_alignment_score`, `status` (`DRAFT`, `SUBMITTED`, `VALIDATED`, `REJECTED`), `created_at`.
- **`curriculum_validations`**: `id` (PK, UUID), `proposal_id` (FK -> `curriculum_proposals.id`), `industry_id` (FK -> `industries.id`), `status` (`APPROVED`, `REJECTED`, `CHANGES_REQUESTED`), `relevance_score` (1-100), `comments`, `suggested_skills` (JSONB), `validated_at`.

### 2.8 Batches, Students & Assessments
- **`batches`**: `id` (PK, UUID), `course_id` (FK -> `courses.id`), `training_provider_id` (FK -> `training_providers.id`), `name`, `start_date`, `end_date`, `seat_capacity`, `status` (`UPCOMING`, `IN_PROGRESS`, `COMPLETED`).
- **`students`**: `id` (PK, UUID), `user_id` (FK -> `users.id`), `training_provider_id` (FK -> `training_providers.id`), `enrollment_no`, `district_id` (FK -> `districts.id`), `highest_education`, `placement_status` (`UNPLACED`, `INTERVIEWING`, `PLACED`), `created_at`.
- **`student_skills`**: `id` (PK, UUID), `student_id` (FK -> `students.id`), `skill_id` (FK -> `skills.id`), `proficiency_level` (1-100), `verified_by_assessment` (bool).
- **`student_certifications`**: `id` (PK, UUID), `student_id` (FK -> `students.id`), `title`, `issuer`, `issue_date`, `credential_url`.
- **`enrollments`**: `id` (PK, UUID), `batch_id` (FK -> `batches.id`), `student_id` (FK -> `students.id`), `enrolled_date`, `status` (`ACTIVE`, `DROPPED`, `GRADUATED`).
- **`assessments`**: `id` (PK, UUID), `course_id` (FK -> `courses.id`), `curriculum_module_id` (FK -> `curriculum_modules.id`, optional), `title`, `type` (`PRE_TRAINING`, `POST_TRAINING`, `THEORY_EXAM`, `PRACTICAL_EVALUATION`), `max_score`.
- **`assessment_results`**: `id` (PK, UUID), `assessment_id` (FK -> `assessments.id`), `student_id` (FK -> `students.id`), `score_obtained`, `passed` (bool), `evaluator_notes`, `evaluated_at`.

### 2.9 Skill Proofs, Certificates & Placements
- **`skill_proofs`**: `id` (PK, UUID), `student_id` (FK -> `students.id`), `skill_id` (FK -> `skills.id`), `proficiency_score` (1-100), `verification_hash` (unique cryptographic token), `theory_assessment_score`, `practical_assessment_score`, `trainer_verified` (bool), `industry_verified` (bool), `issuing_provider_id` (FK -> `training_providers.id`), `validating_industry_id` (FK -> `industries.id`, optional), `issued_at`.
- **`certificates`**: `id` (PK, UUID), `student_id` (FK -> `students.id`), `course_id` (FK -> `courses.id`), `certificate_no` (unique), `verification_url`, `issued_at`.
- **`placements`**: `id` (PK, UUID), `student_id` (FK -> `students.id`), `job_id` (FK -> `jobs.id`), `training_provider_id` (FK -> `training_providers.id`), `placement_date`, `annual_salary_inr`, `status` (`OFFERED`, `ACCEPTED`, `REJECTED`).

### 2.10 Feedback Loop & Strategic Planning
- **`employer_feedback`**: `id` (PK, UUID), `industry_id` (FK -> `industries.id`), `placement_id` (FK -> `placements.id`, optional), `training_provider_id` (FK -> `training_providers.id`), `candidate_preparedness_rating` (1-5), `skill_relevance_rating` (1-5), `reported_skill_deficits` (JSONB), `general_comments`, `submitted_at`.
- **`student_feedback`**: `id` (PK, UUID), `student_id` (FK -> `students.id`), `course_id` (FK -> `courses.id`), `content_quality_rating` (1-5), `trainer_preparedness_rating` (1-5), `equipment_availability_rating` (1-5), `comments`, `submitted_at`.
- **`trainer_feedback`**: `id` (PK, UUID), `trainer_id` (FK -> `trainers.id`), `course_id` (FK -> `courses.id`), `training_provider_id` (FK -> `training_providers.id`), `curriculum_pacing_rating` (1-5), `equipment_adequacy_rating` (1-5), `recommendations`, `submitted_at`.
- **`capacity_plans`**: `id` (PK, UUID), `district_id` (FK -> `districts.id`), `skill_id` (FK -> `skills.id`), `current_training_seats`, `demanded_seats`, `seat_gap`, `recommendation_action` (`INCREASE_SEATS`, `REDUCE_SEATS`, `NEW_TRADE_CENTRE`), `recommended_seats_delta`, `planned_by_role` (`ADMIN`, `TRAINING_PROVIDER`).
- **`investment_scenarios`**: `id` (PK, UUID), `training_provider_id` (FK -> `training_providers.id`), `scenario_name`, `infra_investment_inr`, `equipment_investment_inr`, `trainer_upskilling_inr`, `projected_seat_increase`, `projected_demand_coverage_pct`, `projected_placement_rate_pct`.
- **`recommendations`**: `id` (PK, UUID), `target_type` (`CURRICULUM`, `CAPACITY`, `TRAINER_UPSKILLING`, `EQUIPMENT`), `target_id` (UUID), `title`, `rationale` (JSONB / text), `priority` (`HIGH`, `MEDIUM`, `LOW`), `status` (`PENDING`, `ACCEPTED`, `REJECTED`).

---

## 3. Database Indexes & Integrity Rules
1. `UNIQUE INDEX idx_trainer_email ON trainers (training_provider_id, email)`
2. `INDEX idx_skill_normalized_name ON skills (normalized_name)`
3. `INDEX idx_job_skills_lookup ON job_skills (job_id, skill_id)`
4. `INDEX idx_skill_demand_district ON skill_demand (district_id, skill_id)`
5. `INDEX idx_skill_proof_hash ON skill_proofs (verification_hash)`
6. `CASCADE DELETE` on `training_providers` -> `trainers`, `trainer_skills`, `batches`.
