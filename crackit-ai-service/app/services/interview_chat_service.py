import json
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from app.prompts.interview_chat_prompt import get_interview_chat_prompt

load_dotenv()

class InterviewChatService:

    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = "gemini-2.5-flash"

    def chat(self, data: dict) -> dict:
        system_prompt = get_interview_chat_prompt(data)
        message = data.get("message", "")
        history = data.get("history", [])

        # build contents from history
        contents = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})

        # add current message
        contents.append({"role": "user", "parts": [{"text": message}]})

        response = self.client.models.generate_content(
            model=self.model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.8,
                max_output_tokens=1024,
            )
        )

        return {"reply": response.text.strip()}