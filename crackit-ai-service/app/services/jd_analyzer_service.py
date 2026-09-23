import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.models.jd_models import JDAnalysisResponse
from app.models.jd_models import JDAnalysisRequest, JDAnalysisResponse
from app.prompts.jd_analysis_prompt import build_jd_analysis_prompt

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class JDAnalyzerService:

    def analyze_jd(self, request: JDAnalysisRequest) -> JDAnalysisResponse:
        prompt = build_jd_analysis_prompt(
            jd_text=request.jdText,
            summary=request.summary,
            skills=request.skills,
            experiences=request.experiences,
            projects=request.projects
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=JDAnalysisResponse
            )
        )

        content = response.text.strip()

        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            raise RuntimeError(f"Gemini returned invalid JSON: {content}")

        return JDAnalysisResponse(**data)