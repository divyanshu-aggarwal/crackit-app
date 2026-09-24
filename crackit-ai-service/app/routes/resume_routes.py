import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response

from app.models.resume_models import (
    ResumeTailoringRequest,
    ResumeTailoringResponse,
    ResumePdfRequest,
    ParsedResume,
)
from app.services.resume_tailoring_service import ResumeTailoringService
from app.services.resume_parse_service import ResumeParseService
from app.services.resume_pdf_service import ResumePdfService

logger = logging.getLogger(__name__)

router = APIRouter()

resume_tailoring_service = ResumeTailoringService()
resume_parse_service = ResumeParseService()
resume_pdf_service = ResumePdfService()


@router.post("/tailor-resume", response_model=ResumeTailoringResponse)
def tailor_resume(request: ResumeTailoringRequest):
    try:
        return resume_tailoring_service.tailor_resume(request)
    except Exception as e:
        logger.error(f"tailor_resume error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-resume", response_model=ParsedResume)
async def parse_resume(file: UploadFile = File(...)):
    try:
        pdf_bytes = await file.read()
        return resume_parse_service.parse_pdf(pdf_bytes)
    except Exception as e:
        logger.error(f"parse_resume error: {e}", exc_info=True)
        # Attempt fallback rather than crashing with 500
        try:
            return resume_parse_service._heuristic_fallback_parse("")
        except Exception:
            raise HTTPException(status_code=400, detail=f"Failed to parse resume PDF: {str(e)}")


@router.post("/generate-resume-pdf")
def generate_resume_pdf(request: ResumePdfRequest):
    try:
        data = request.model_dump() if hasattr(request, "model_dump") else request.dict()
        pdf_bytes = resume_pdf_service.generate_pdf(data, template="classic")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"},
        )
    except Exception as e:
        logger.error(f"generate_resume_pdf error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")