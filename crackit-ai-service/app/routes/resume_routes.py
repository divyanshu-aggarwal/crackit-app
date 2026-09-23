from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response

from app.models.resume_models import ResumeTailoringRequest, ResumeTailoringResponse, ResumePdfRequest
from app.services.resume_tailoring_service import ResumeTailoringService
from app.services.resume_parse_service import ResumeParseService
from app.services.resume_pdf_service import ResumePdfService
from app.models.resume_models import ParsedResume

router = APIRouter()

resume_tailoring_service = ResumeTailoringService()
resume_parse_service = ResumeParseService()
resume_pdf_service = ResumePdfService()


@router.post("/tailor-resume", response_model=ResumeTailoringResponse)
def tailor_resume(request: ResumeTailoringRequest):
    return resume_tailoring_service.tailor_resume(request)


@router.post("/parse-resume", response_model=ParsedResume)
async def parse_resume(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    return resume_parse_service.parse_pdf(pdf_bytes)


@router.post("/generate-resume-pdf")
def generate_resume_pdf(request: ResumePdfRequest):
    pdf_bytes = resume_pdf_service.generate_pdf(request.dict(), template="classic")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resume.pdf"}
    )