from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.db.session import engine, Base, SessionLocal
from app.db.seed_data import seed
from app.models import entities
from app.api.v1 import auth, students, employers, skills, jobs, quiz, admin, courses, trainer

app = FastAPI(title='Skill Nexus API', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

Base.metadata.create_all(bind=engine)

async def telemetry_scheduler_loop():
    """
    Background worker loop:
    1. Runs 6 seconds after server startup.
    2. Auto-syncs if data has never been synced or is >12 hours stale.
    3. Repeats check every 1 hour while server is awake.
    """
    await asyncio.sleep(6)
    while True:
        try:
            db = SessionLocal()
            from app.services.ingestion_service import should_auto_sync, sync_all_telemetry
            if should_auto_sync(db, max_stale_hours=12):
                print("[Auto-Sync] Telemetry is uninitialized or >12h stale. Running automatic sync...")
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, sync_all_telemetry, db)
                print("[Auto-Sync] Telemetry synchronization completed successfully.")
            db.close()
        except Exception as e:
            print(f"[Auto-Sync Error] Background scheduler error: {e}")

        await asyncio.sleep(3600)

@app.on_event('startup')
async def startup():
    seed()
    asyncio.create_task(telemetry_scheduler_loop())


@app.get('/health')
def health():
    return {'status': 'healthy', 'platform': 'Skill Nexus', 'version': '2.0.0'}

app.include_router(auth.router, prefix='/api/v1/auth', tags=['auth'])
app.include_router(students.router, prefix='/api/v1/students', tags=['students'])
app.include_router(employers.router, prefix='/api/v1/employers', tags=['employers'])
app.include_router(skills.router, prefix='/api/v1', tags=['skills'])
app.include_router(jobs.router, prefix='/api/v1', tags=['jobs'])
app.include_router(quiz.router, prefix='/api/v1', tags=['quiz'])
app.include_router(admin.router, prefix='/api/v1/admin', tags=['admin'])
app.include_router(courses.router, prefix='/api/v1/courses', tags=['courses'])
app.include_router(trainer.router, prefix='/api/v1/trainer', tags=['trainer'])
