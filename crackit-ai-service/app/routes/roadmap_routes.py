from fastapi import APIRouter
from app.services.roadmap_service import RoadmapService

router = APIRouter()
roadmap_service = RoadmapService()

@router.post("/generate-roadmap")
def generate_roadmap(data: dict):
    return roadmap_service.generate_roadmap(data)
