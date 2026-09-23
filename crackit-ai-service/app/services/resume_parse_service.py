import json
import os

import fitz  # PyMuPDF
from dotenv import load_dotenv
from google import genai

from app.models.resume_models import ParsedResume
from app.prompts.resume_parse_prompt import build_resume_parse_prompt

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class ResumeParseService:

    def parse_pdf(self, pdf_bytes: bytes) -> ParsedResume:
        # extract text from PDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()

        if not text.strip():
            raise RuntimeError("Could not extract text from PDF — it may be image-based")

        prompt = build_resume_parse_prompt(text)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        content = response.text.strip()
        content = content.replace("```json", "").replace("```", "").strip()

        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            raise RuntimeError(f"Gemini returned invalid JSON: {content[:200]}")

        return ParsedResume(**data)