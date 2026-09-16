# Role & Permission Matrix: Smart Skill Intelligence Platform

## 1. Principles of Access Control
The platform implements granular Role-Based Access Control (RBAC) enforced both at the FastAPI middleware/dependency layer (`Depends(get_current_active_user)`) and within React protected route guards.

### The 4 Recognized System Roles:
1. **`ADMIN` (Government / National Skill Development Corporation / State Skill Mission)**
2. **`TRAINING_PROVIDER` (Technical Training Institutes, ITIs, Polytechnics, Vocational Centers)**
3. **`INDUSTRY` (Employers, Manufacturing Enterprises, Tech Companies, Sector Skill Councils)**
4. **`STUDENT` (Vocational Trainees, Engineering Candidates, Apprentices)**

> **CRITICAL RULE**: Trainers do NOT possess user logins or dashboards. A Trainer is a managed data entity associated 1:N under a specific `TRAINING_PROVIDER`.

---

## 2. Resource Permission Matrix

| Resource / Action | ADMIN | TRAINING_PROVIDER | INDUSTRY | STUDENT |
| :--- | :---: | :---: | :---: | :---: |
| **National Overview & Macro Heatmap** | Full Read | Aggregate Read | Aggregate Read | Restricted |
| **District Training Capacity Planning** | Read / Write | Propose / Read | Read | No Access |
| **Institute Profile & Facilities** | Read / Audit | Read / Write (Own) | Read Public Info | Read Public Info |
| **Trainer Profiles & Readiness** | Aggregate Read | Full CRUD (Own Institute) | No Access | No Access |
| **Curriculum Definition & Editing** | Read / Audit | Full CRUD (Own Courses) | Read / Review Only | Read Enrolled Only |
| **Curriculum Change Simulator** | Full Access | Full Access | No Access | No Access |
| **Curriculum Validation & Review** | Read All | Submit Proposals | Review & Approve/Reject | No Access |
| **Equipment Inventory & Gap Analysis**| Aggregate Read | Full CRUD (Own Institute) | No Access | No Access |
| **Student Profiles & Enrollment** | Aggregate Read | Manage Own Students | View Verified Candidates| View / Edit Own |
| **Pre / Post Assessment Scoring** | Aggregate Read | Conduct & Score Own | View Verified Results | Take Assessments |
| **Digital Skill Passport Issuance** | Verify & Audit | Issue (Own Students) | Verify Any / Public | View & Share Own |
| **Job Postings & Requirements** | Aggregate Read | Read Active Jobs | Full CRUD (Own Jobs) | Read & Apply |
| **AI Job Description Parsing** | Accessible | Accessible | Full Access | No Access |
| **Candidate Placement Tracking** | Aggregate Read | Manage Placements | Record Hiring Decisions | View Status |
| **Feedback Loop Ingestion** | Full Read | Read Received Feedback| Submit Employer Feedback| Submit Trainee Feedback|
| **Capital Investment Simulator** | Full Access | Full Access | No Access | No Access |
| **System Audit Logs & Governance** | Full Access | No Access | No Access | No Access |

---

## 3. Data Isolation and Multi-Tenancy Rules

1. **Training Provider Isolation:**
   - Any query to `/api/v1/training-providers/me/*` automatically extracts the authenticated user's `organization_id` or `training_provider_id` from the JWT claims.
   - It is impossible for Institute A to read, modify, or assign trainers belonging to Institute B.
2. **Trainer Safety Boundary:**
   - Trainers cannot authenticate or issue tokens.
   - Any API altering a trainer's records (`/api/v1/training-providers/me/trainers/{id}`) checks that `trainer.training_provider_id == current_user.training_provider.id`.
3. **Student Privacy Protection:**
   - Detailed personal data of students is shielded from employers until students apply to a job posting or choose to share their public Skill Passport verification link.
4. **Public Verification Sandbox:**
   - The `/verify-passport/{hash}` endpoint allows external verification of authentic skill credentials without requiring an active platform account.
