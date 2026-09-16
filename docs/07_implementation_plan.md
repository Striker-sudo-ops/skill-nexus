# Implementation Plan: Smart Skill Intelligence & Training Alignment Platform

**Project Title:** Smart Skill Intelligence & Training Alignment Platform (SSITAP)  
**Hackathon Target:** Smart India Hackathon (SIH) 2026  
**Problem Statement ID:** 26134  
**Problem Statement:** Challenges in aligning skill development programs with industry requirements and emerging job market demands.

---

## 1. Goal Description

Build a complete, production-quality, responsive web application and AI intelligence backend that connects:
$$\text{Industry Demand} \rightarrow \text{Skills} \rightarrow \text{Job Roles} \rightarrow \text{Curriculum} \rightarrow \text{Training Providers} \rightarrow \text{Trainers} \rightarrow \text{Equipment} \rightarrow \text{Students} \rightarrow \text{Assessment} \rightarrow \text{Skill Proof} \rightarrow \text{Jobs} \rightarrow \text{Placement} \rightarrow \text{Employer Feedback} \rightarrow \text{Updated Demand}$$

### The 4 Dedicated User Roles:
1. **Government / Admin:** National overview, District Skill Heatmap, Demand vs. Supply analytics, Capacity planning, and Aggregated Trainer Intelligence.
2. **Training Provider / Institute:** Operational epicenter managing Institute Profile, Industry Demand, Curriculum Gap Engine, Curriculum Simulator, AI Recommendations, Equipment Gap, Internal Trainers & Trainer Readiness (TTT plans), Student Gap, Assessments (Pre/Post), and Digital Skill Passport issuance.
3. **Industry / Employer:** Job posting with AI skill extraction/normalization, Candidate search with verified skill proofs, Curriculum proposal validation, and Post-hire candidate feedback.
4. **Student / Candidate:** Profile & skills portfolio, Pre/Post assessments, Skill gap analysis vs. target career path, Recommended courses, Job matching, and Shareable Digital Skill Passport.

> **Strict Architectural Constraint:** There is **NO** independent Trainer Dashboard and **NO** Trainer Login. Trainers are managed entities strictly belonging to a Training Provider (`training_providers.id` $\rightarrow$ `trainers.training_provider_id`). Admin has aggregated oversight.

---

## 2. Implementation Phases

- **Phase 1:** Project Setup & Baseline Infrastructure (FastAPI + React + TypeScript + Tailwind + ECharts + Leaflet)
- **Phase 2:** Relational Database Schema & Realistic Seed Engine (40+ tables, multi-sector, multi-district)
- **Phase 3:** AI & Analytics Engine (Gap Engine, Simulator, Trainer Readiness, Forecasting, Skill Passport)
- **Phase 4:** Backend REST API Endpoints & Role Guards
- **Phase 5:** Government / Admin Dashboard (Frontend)
- **Phase 6:** Training Provider Command Center (Frontend)
- **Phase 7:** Industry / Employer Portal (Frontend)
- **Phase 8:** Student / Candidate Portal (Frontend)
- **Phase 9:** Testing, Verification & Closed-Loop Demo
