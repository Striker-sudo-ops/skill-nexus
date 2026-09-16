# Frontend Route Structure: Smart Skill Intelligence Platform

## 1. Global Navigation & Layout Architecture
The frontend leverages React Router with protected role-based routes. Each role is greeted with a tailored workspace shell consisting of:
- **Header:** System status, global district/trade filters, active user profile badge, notifications popover, and role switcher for demo evaluation.
- **Sidebar:** Contextual navigation items structured per role requirements.
- **Breadcrumbs & Action Bar:** Context path with direct export actions (PDF/CSV/Excel) and simulator quick-launch buttons.

---

## 2. Route Hierarchy

### 2.1 Public Routes
- `/login` - Unified authentication portal with one-click demo role switcher (`Admin`, `Training Provider`, `Industry`, `Student`).
- `/register` - Organization and Candidate onboarding flow.
- `/verify-passport/:verificationHash` - Publicly verifiable Digital Skill Passport page (accessible by any employer scanning a QR code or clicking a shared URL).

---

### 2.2 Government / Admin Workspace (`/admin`)
- `/admin/dashboard` - Executive National Overview (KPIs, placement rates, alignment index, active providers, live job demand).
- `/admin/demand-intelligence` - Deep-dive demand trends, sector-wise vacancies, and salary benchmarks.
- `/admin/district-heatmap` - Interactive Leaflet + OpenStreetMap displaying district-level skill shortages and seat capacities.
- `/admin/demand-vs-supply` - Multi-axis analytical comparison between industry demand, training capacity, and available workforce.
- `/admin/training-capacity` - Regional training capacity planner and seat addition/reduction recommendations.
- `/admin/trainer-intelligence` - Aggregated nationwide trainer skill coverage, shortage heatmaps, and certification expiries.
- `/admin/curriculum-intelligence` - National curriculum alignment monitor across technical trades and educational boards.
- `/admin/emerging-skills` - Emerging vs. obsolescent skill radar (EV, AI, Robotics, Green Hydrogen).
- `/admin/placement-analytics` - Longitudinal placement tracking, time-to-hire, and wage growth analytics.
- `/admin/industry-feedback` - Aggregated employer satisfaction scores, recurring skill complaints, and qualitative reviews.
- `/admin/reports` - Automated PDF/Excel report builder (District Training Plans, Skill Gap Audits).
- `/admin/settings` - System configuration, taxonomy weights, and audit trails.

---

### 2.3 Training Provider Workspace (`/provider`)
*(Core Operational Command Center - strictly manages internal trainers & labs)*
- `/provider/dashboard` - Institute overview: active batches, alignment score, trainer utilization, lab readiness, and placement rate.
- `/provider/profile` - Institute profile, trades offered, accredited labs, 3D labs, and industry MoU records.
- `/provider/industry-demand` - Real-time regional employer skill requirements filtered by trade and proficiency level.
- `/provider/curriculum-gap` - **Core Gap Engine:** Side-by-side comparison of industry required skills vs. current curriculum with alignment scoring.
- `/provider/curriculum-simulator` - **Simulator Engine:** Interactive sandbox to test addition/removal of modules and project new alignment scores.
- `/provider/ai-recommendations` - AI-generated recommendations for adding, upgrading, or retiring modules with explainability logs.
- `/provider/industry-validation` - Curriculum proposal tracker and industry endorsement review portal.
- `/provider/trainers` - **Internal Trainer Management:** List, add, edit, and assign institute trainers and manage their certifications.
- `/provider/trainer-readiness` - **Trainer Readiness Analysis:** Trainer skill vs. emerging industry skill gap diagnostics and Train-the-Trainer program planning.
- `/provider/equipment` - Equipment inventory, operational health, and maintenance schedules.
- `/provider/equipment-gap` - Lab readiness analysis against recommended standards for new technologies.
- `/provider/students` - Student directory, batch enrollments, and academic progression.
- `/provider/student-gaps` - Student skill gap analytics across batches, trades, and individual students.
- `/provider/training-planning` - Batch scheduling, curriculum module allocation, trainer timetable, and lab reservations.
- `/provider/assessments` - Pre-training and Post-training evaluation designer, rubric manager, and score recorder.
- `/provider/before-after-analysis` - Before vs. After training comparative analytics showing proficiency point improvements.
- `/provider/skill-proofs` - Digital Skill Passport issuance and cryptographic verification token generation.
- `/provider/jobs-eligibility` - Student eligibility matcher against live employer vacancies.
- `/provider/placements` - Placement tracker, hiring offers, and starting packages.
- `/provider/capacity-planning` - Institute seat capacity optimization engine.
- `/provider/investment-simulator` - Capital and trainer investment impact calculator.
- `/provider/feedback` - Course feedback collected from students, internal trainers, and hiring employers.
- `/provider/reports` - Institute performance, trainer readiness, and batch outcome export.

---

### 2.4 Industry / Employer Workspace (`/industry`)
- `/industry/dashboard` - Employer portal summary: active postings, candidate applications, curriculum validation requests, and feedback status.
- `/industry/profile` - Company profile, operational sites, and manufacturing plants.
- `/industry/jobs` - Job posting management with AI job description parser and skill normalizer.
- `/industry/post-job` - Intuitive multi-step job creation wizard featuring automatic skill extraction.
- `/industry/candidate-search` - Search candidate talent pool filtered by verified skill proficiencies and districts.
- `/industry/curriculum-validation` - Review proposed curricula from training providers; approve, reject, or suggest skill modifications.
- `/industry/consultation` - Public-private skill advisory requests and emerging technology roundtables.
- `/industry/feedback` - Submit evaluation on candidate on-the-job readiness and report missing curriculum competencies.

---

### 2.5 Student / Candidate Workspace (`/student`)
- `/student/dashboard` - Student home: target career path status, verified skill portfolio, recommended courses, and active job alerts.
- `/student/profile` - Personal bio, educational background, and verified credentials.
- `/student/my-skills` - Visual radar and list of current skills with proficiency levels.
- `/student/assessments` - Interactive testing portal for diagnostic pre-training and summative post-training evaluations.
- `/student/skill-gap` - Visual gap report comparing student's abilities with target job role requirements.
- `/student/career-path` - Step-by-step career progression roadmap showing sequential skill acquisitions needed for aspirational roles.
- `/student/recommended-courses` - Personalized courses and training providers mapped to fill diagnosed skill deficits.
- `/student/jobs` - Job board featuring instant AI match percentages (Eligible, Partially Eligible) and missing skill alerts.
- `/student/skill-passport` - **Digital Skill Passport:** Interactive shareable credentials with cryptographic hash and QR code.
- `/student/placements` - Track received job offers, interview invites, and placement status.
