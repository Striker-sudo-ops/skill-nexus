# REST API Specification: Smart Skill Intelligence Platform

## 1. Global API Standards
- **Base URL:** `/api/v1`
- **Authentication:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Format:**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional contextual message",
    "timestamp": "2026-09-08T22:50:00Z"
  }
  ```
- **Error Format:**
  ```json
  {
    "success": false,
    "error_code": "RESOURCE_NOT_FOUND",
    "message": "Specific human-readable failure reason",
    "details": []
  }
  ```

---

## 2. Authentication & Core Management
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new User & Organization (`ADMIN`, `TRAINING_PROVIDER`, `INDUSTRY`, `STUDENT`) |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT token + user profile with role |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current session profile and associated organization entity |
| `GET` | `/api/v1/districts` | Public | Retrieve districts with geographic coordinates and industrial ratings |

---

## 3. Government / Admin Intelligence APIs
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/national-overview` | `ADMIN` | National metrics: providers, students, trainers, placement rate, overall skill gap |
| `GET` | `/api/v1/admin/district-heatmap` | `ADMIN`, `TRAINING_PROVIDER` | GeoJSON & data points for district skill shortages, surplus, and capacities |
| `GET` | `/api/v1/admin/demand-vs-supply` | `ADMIN` | Triangulated demand vs. training capacity vs. candidate pool |
| `GET` | `/api/v1/admin/trainer-intelligence` | `ADMIN` | Aggregated national & district trainer skill readiness and shortages |
| `GET` | `/api/v1/admin/capacity-recommendations` | `ADMIN` | Recommendations on seat additions, cuts, and new regional training centres |
| `GET` | `/api/v1/admin/audit-logs` | `ADMIN` | System-wide audit trail for compliance and governance |

---

## 4. Training Provider & Trainer Intelligence APIs
*(Strict rule: Trainers are managed resources of Training Providers. No independent trainer auth).*
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/training-providers/me/profile` | `TRAINING_PROVIDER` | Get institute infrastructure, labs, trades, and capacity |
| `PUT` | `/api/v1/training-providers/me/profile` | `TRAINING_PROVIDER` | Update institute profile and facilities |
| `GET` | `/api/v1/training-providers/me/trainers` | `TRAINING_PROVIDER` | List all trainers under this institute with skills & certifications |
| `POST` | `/api/v1/training-providers/me/trainers` | `TRAINING_PROVIDER` | Add new internal trainer profile to institute |
| `PUT` | `/api/v1/training-providers/me/trainers/{id}` | `TRAINING_PROVIDER` | Update trainer qualifications, availability, and skills |
| `DELETE` | `/api/v1/training-providers/me/trainers/{id}` | `TRAINING_PROVIDER` | Remove trainer from institute |
| `GET` | `/api/v1/training-providers/me/trainer-readiness` | `TRAINING_PROVIDER` | Trainer skill gap analysis vs. emerging industry requirements & TTT plans |
| `GET` | `/api/v1/training-providers/me/equipment` | `TRAINING_PROVIDER` | Equipment inventory, operational status, and utilization |
| `POST` | `/api/v1/training-providers/me/equipment` | `TRAINING_PROVIDER` | Register equipment unit or update maintenance records |
| `GET` | `/api/v1/training-providers/me/equipment-gap` | `TRAINING_PROVIDER` | Compare current equipment vs. curriculum & industry requirements |
| `GET` | `/api/v1/training-providers/me/students` | `TRAINING_PROVIDER` | List enrolled students, batches, and readiness scores |
| `GET` | `/api/v1/training-providers/me/student-gaps` | `TRAINING_PROVIDER` | Batch and trade-level student skill gap diagnostics |

---

## 5. Curriculum Intelligence & Simulation Engine
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/curricula` | `TRAINING_PROVIDER`, `ADMIN` | List curricula and active versions by course |
| `GET` | `/api/v1/curricula/{id}/gap-analysis` | `TRAINING_PROVIDER`, `ADMIN` | Compute Curriculum Alignment Score and list missing/outdated modules |
| `GET` | `/api/v1/curricula/{id}/ai-recommendations`| `TRAINING_PROVIDER` | AI recommended module additions/retirements with explicit rationales |
| `POST` | `/api/v1/curricula/{id}/simulate` | `TRAINING_PROVIDER` | **Simulator:** Predict alignment score change, hours, and trainer requirements |
| `POST` | `/api/v1/curricula/proposals` | `TRAINING_PROVIDER` | Submit proposed curriculum revision for industry validation |
| `GET` | `/api/v1/curricula/validations` | `INDUSTRY`, `TRAINING_PROVIDER` | View status and feedback on curriculum proposals |
| `POST` | `/api/v1/curricula/validations/{id}/review` | `INDUSTRY` | Industry review: Approve, Reject, or suggest skills/proficiency adjustments |

---

## 6. Industry & Job Intelligence APIs
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/industries/me/profile` | `INDUSTRY` | Get company profile and manufacturing/office locations |
| `POST` | `/api/v1/industries/me/jobs` | `INDUSTRY` | Post job with AI parsing (extracts skills, proficiency, and normalized roles) |
| `GET` | `/api/v1/industries/me/jobs` | `INDUSTRY` | List posted jobs, applicant matches, and vacancy statuses |
| `POST` | `/api/v1/ai/parse-job-description` | `INDUSTRY`, `ADMIN` | AI Service: Extract skills, proficiency, and normalized taxonomy from raw text |
| `GET` | `/api/v1/industries/candidate-search` | `INDUSTRY` | Search certified candidates by skill, verified proof, and district |
| `POST` | `/api/v1/industries/feedback` | `INDUSTRY` | Submit employer feedback on hired graduates & reporting skill deficits |

---

## 7. Student & Digital Skill Passport APIs
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/students/me/profile` | `STUDENT` | Retrieve student profile, enrolled courses, and verified skills |
| `GET` | `/api/v1/students/me/skill-gap` | `STUDENT` | Compare student skills against target career role requirements |
| `GET` | `/api/v1/students/me/career-path` | `STUDENT` | AI step-by-step career path from current skills to target aspirational role |
| `GET` | `/api/v1/students/me/job-matches` | `STUDENT` | Ranked jobs by match percentage (Eligible, Partially Eligible, Missing Skills) |
| `GET` | `/api/v1/students/me/skill-passport` | `STUDENT`, Public (via hash) | Retrieve Digital Skill Passport with verifiable proofs and QR payload |
| `POST` | `/api/v1/assessments/{id}/submit` | `STUDENT` | Submit assessment answers (Pre/Post training evaluations) |

---

## 8. Strategic Planning & Forecasting APIs
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/forecasts/skills` | `ADMIN`, `TRAINING_PROVIDER` | Time-series forecasting of skill demand over past, current, and future years |
| `GET` | `/api/v1/forecasts/emerging-radar` | All Roles | Radar data on rapidly growing vs. declining skills with ADD/REDUCE tags |
| `POST` | `/api/v1/capacity/simulate-investment` | `ADMIN`, `TRAINING_PROVIDER` | Calculate impact of capital/trainer investments on seats and demand coverage |
| `GET` | `/api/v1/reports/export` | `ADMIN`, `TRAINING_PROVIDER` | Export gap reports, capacity plans, and passports as PDF, CSV, or Excel |
