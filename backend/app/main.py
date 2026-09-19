from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.db.session import engine, Base, SessionLocal
from app.db.seed_data import seed
from app.models import entities
from app.api.v1 import auth, students, employers, skills, jobs, quiz, admin, courses, trainer, messages, suggestions, feedback

app = FastAPI(title='Skill Nexus API', version='2.0.1')  # force redeploy: DB purged, no mock courses

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

Base.metadata.create_all(bind=engine)

def ensure_schema_compatibility():
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if 'jobs' in inspector.get_table_names():
            cols = [c['name'] for c in inspector.get_columns('jobs')]
            with engine.connect() as conn:
                if 'company_name' not in cols:
                    conn.execute(text('ALTER TABLE jobs ADD COLUMN company_name VARCHAR'))
                if 'apply_url' not in cols:
                    conn.execute(text('ALTER TABLE jobs ADD COLUMN apply_url VARCHAR'))
                if 'source' not in cols:
                    conn.execute(text('ALTER TABLE jobs ADD COLUMN source VARCHAR'))
                if 'source_job_id' not in cols:
                    conn.execute(text('ALTER TABLE jobs ADD COLUMN source_job_id VARCHAR'))
                if 'fetched_at' not in cols:
                    conn.execute(text('ALTER TABLE jobs ADD COLUMN fetched_at DATETIME'))
                if 'last_seen_at' not in cols:
                    conn.execute(text('ALTER TABLE jobs ADD COLUMN last_seen_at DATETIME'))
                if 'internship_duration' not in cols:
                    conn.execute(text('ALTER TABLE jobs ADD COLUMN internship_duration VARCHAR'))
                conn.commit()
        if 'courses' in inspector.get_table_names():
            course_cols = [c['name'] for c in inspector.get_columns('courses')]
            with engine.connect() as conn:
                if 'status' not in course_cols:
                    conn.execute(text("ALTER TABLE courses ADD COLUMN status VARCHAR DEFAULT 'ACTIVE'"))
                conn.commit()
        # Create any missing tables defined in entities model (dialect-neutral for SQLite and Postgres)
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f'[Schema] Migration notice: {e}')


ensure_schema_compatibility()

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
    # On serverless platforms like Vercel, background tasks cause 504 invocation timeouts.
    # Telemetry scraping runs safely in persistent environments or on explicit admin demand.
    import os
    if not os.getenv("VERCEL") and not os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        asyncio.create_task(telemetry_scheduler_loop())
    else:
        print("[Serverless] Skipping background telemetry loop to prevent function timeouts.")


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
app.include_router(messages.router, prefix='/api/v1', tags=['messages'])
app.include_router(suggestions.router, prefix='/api/v1', tags=['suggestions'])
app.include_router(feedback.router, prefix='/api/v1', tags=['feedback'])
