from fastapi import APIRouter

from app.models.jd_models import (
    JDAnalysisRequest,
    JDAnalysisResponse
)

from app.services.jd_analyzer_service import JDAnalyzerService

router = APIRouter()

jd_analyzer_service = JDAnalyzerService()


@router.post("/analyze-jd", response_model=JDAnalysisResponse)
def analyze_jd(request: JDAnalysisRequest):
    return jd_analyzer_service.analyze_jd(request)