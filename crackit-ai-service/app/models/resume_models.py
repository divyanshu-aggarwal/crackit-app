from pydantic import BaseModel
from typing import List, Optional


# ── Tailoring models (existing) ──────────────────────────
class BulletPoint(BaseModel):
    bulletText: str
    technologies: str


class TailoredExperience(BaseModel):
    companyName: str
    role: str
    bullets: List[BulletPoint]


class TailoredProject(BaseModel):
    title: str
    description: str
    techStack: str
    impactMetrics: str = ""
    bullets: List[BulletPoint] = []


class ResumeTailoringRequest(BaseModel):
    jdAnalysis: dict
    summary: str
    skills: List[dict]
    experiences: List[dict]
    projects: List[dict]


class ResumeTailoringResponse(BaseModel):
    tailoredSummary: str
    tailoredSkills: List[str]
    tailoredExperiences: List[TailoredExperience]
    tailoredProjects: List[TailoredProject]
    atsKeywordsUsed: List[str]
    matchScore: int


# ── Resume parsing models ─────────────────────────────────
class ParsedBullet(BaseModel):
    bulletText: str
    technologies: str = ""


class ParsedExperience(BaseModel):
    companyName: str
    role: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    currentCompany: bool = False
    description: str = ""
    bullets: List[ParsedBullet] = []


class ParsedSkill(BaseModel):
    skillName: str
    category: str = ""
    proficiencyLevel: str = ""
    yearsUsed: int = 0


class ParsedProject(BaseModel):
    title: str
    description: str = ""
    techStack: str = ""
    githubUrl: str = ""
    impactMetrics: str = ""
    bullets: List[ParsedBullet] = []


class ParsedEducation(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""
    score: str = ""


class ParsedResume(BaseModel):
    summary: str = ""
    skills: List[ParsedSkill] = []
    experiences: List[ParsedExperience] = []
    projects: List[ParsedProject] = []
    education: List[ParsedEducation] = []


# ── PDF generation models ─────────────────────────────────
class ResumePdfRequest(BaseModel):
    fullName: str
    email: str
    phone: str = ""
    location: str = ""
    linkedinUrl: str = ""
    githubUrl: str = ""
    summary: str = ""
    skills: List[dict] = []
    experiences: List[dict] = []
    projects: List[dict] = []
    education: Optional[object] = None
    photoBase64: Optional[str] = None