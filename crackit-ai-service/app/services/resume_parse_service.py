import json
import os

import fitz  # PyMuPDF
from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.models.resume_models import ParsedResume
from app.prompts.resume_parse_prompt import build_resume_parse_prompt

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class ResumeParseService:

    def parse_pdf(self, pdf_bytes: bytes) -> ParsedResume:
        # 1. Attempt text extraction via PyMuPDF
        text = ""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception:
            text = ""

        # 2. If text extracted, send prompt with text; otherwise send multimodal PDF bytes directly to Gemini
        if text.strip() and len(text.strip()) > 30:
            prompt = build_resume_parse_prompt(text)
            contents = prompt
        else:
            # Multimodal fallback: pass PDF bytes directly to Gemini
            pdf_part = types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")
            prompt = build_resume_parse_prompt("Extract all resume details accurately from the attached PDF document.")
            contents = [pdf_part, prompt]

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ParsedResume,
                temperature=0.2
            )
        )

        content = response.text.strip()
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            clean = content.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean)

        return ParsedResume(**data)