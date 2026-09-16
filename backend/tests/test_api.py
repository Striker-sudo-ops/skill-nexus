import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["sih_problem_statement_id"] == "26134"

def test_admin_national_overview():
    response = client.get("/api/v1/admin/national-overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["average_placement_rate"] > 70

def test_district_heatmap():
    response = client.get("/api/v1/admin/district-heatmap")
    assert response.status_code == 200
    data = response.json()
    assert "districts" in data
    assert len(data["districts"]) > 0

def test_curriculum_gap_engine():
    response = client.get("/api/v1/training-providers/curriculum-gap")
    assert response.status_code == 200
    data = response.json()
    assert "alignment_score" in data
    assert "comparison_table" in data
    assert len(data["comparison_table"]) > 0

def test_curriculum_change_simulator():
    payload = {
        "modules_to_add": [
            {
                "title": "Advanced EV Battery Diagnostics",
                "hours_theory": 40,
                "hours_practical": 60,
                "target_proficiency": 85,
                "skill_ids": []
            }
        ]
    }
    response = client.post("/api/v1/training-providers/curriculum-simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "current_alignment_score" in data
    assert "projected_alignment_score" in data
    assert "preset_comparison_options" in data

def test_trainer_readiness_no_trainer_dashboard_rule():
    # Enforce: Trainer readiness exists strictly under training-providers
    response = client.get("/api/v1/training-providers/trainer-readiness")
    assert response.status_code == 200
    data = response.json()
    assert "trainers" in data
    assert "upskilling_recommendations" in data

def test_skill_passport_and_verification():
    passport_res = client.get("/api/v1/students/skill-passport")
    assert passport_res.status_code == 200
    data = passport_res.json()
    assert "verified_skills" in data
    assert len(data["verified_skills"]) > 0
    proof_hash = data["verified_skills"][0]["verification_hash"]

    verify_res = client.get(f"/api/v1/students/verify-proof/{proof_hash}")
    assert verify_res.status_code == 200
    assert verify_res.json()["valid"] is True
