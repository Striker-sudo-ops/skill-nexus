from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.db.seed_data import seed
from app.models import entities
from app.api.v1 import auth, students, employers, skills, jobs, quiz, admin, courses, trainer

app = FastAPI(title='Skill Nexus API', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

Base.metadata.create_all(bind=engine)

@app.on_event('startup')
def startup():
    seed()

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
