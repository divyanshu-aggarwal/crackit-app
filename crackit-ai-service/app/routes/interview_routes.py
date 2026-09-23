from fastapi import APIRouter
from app.services.interview_prep_service import InterviewPrepService
from app.services.interview_chat_service import InterviewChatService

router = APIRouter()
interview_prep_service = InterviewPrepService()
interview_chat_service = InterviewChatService()


@router.post("/generate-interview-prep")
def generate_interview_prep(data: dict):
    return interview_prep_service.generate_prep(data)

@router.post("/interview-chat")
def interview_chat(data: dict):
    return interview_chat_service.chat(data)