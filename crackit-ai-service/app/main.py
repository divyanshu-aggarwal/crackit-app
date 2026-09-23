from fastapi import FastAPI
from app.routes.jd_routes import router as jd_router
from app.routes.resume_routes import router as resume_router
from app.routes.interview_routes import router as interview_router

app = FastAPI(
    title="CrackIt AI Service",
    version="1.0.0"
)

app.include_router(jd_router, prefix="/api/ai", tags=["JD Analyzer"])
app.include_router(resume_router, prefix="/api/ai", tags=["Resume"])
app.include_router(interview_router, prefix="/api/ai")

@app.get("/")
def health_check():
    return {"message": "CrackIt AI Service is running"}