import json
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from app.prompts.roadmap_prompt import get_roadmap_prompt

load_dotenv()

class RoadmapService:

    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = "gemini-2.5-flash"

    def generate_roadmap(self, data: dict) -> dict:
        prompt = get_roadmap_prompt(data)
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=16384,
            )
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        return json.loads(raw)
