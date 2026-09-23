def build_resume_parse_prompt(resume_text: str) -> str:
    return f"""
You are an expert resume parser.

Extract all information from the resume text below and return it as structured JSON.

Rules:
- Extract every experience, skill, and project you find
- For bullets: each bullet point under an experience becomes a separate bullet object
- For technologies in bullets: extract any tech mentioned in that bullet (comma separated)
- For skills: group them by category if possible (e.g. "Languages", "Frameworks", "Tools", "Databases")
- proficiencyLevel: infer from context — "Beginner", "Intermediate", "Advanced", or "Expert"
- yearsUsed: infer from experience dates if possible, otherwise 0
- startDate and endDate: format as YYYY-MM-DD if possible, otherwise leave empty string
- currentCompany: true if the experience says "Present" or "Current"
- summary: the professional summary/objective section if present
- Return ONLY valid JSON, no markdown, no explanation

Return this exact structure:
{{
  "summary": "",
  "skills": [
    {{
      "skillName": "",
      "category": "",
      "proficiencyLevel": "",
      "yearsUsed": 0
    }}
  ],
  "experiences": [
    {{
      "companyName": "",
      "role": "",
      "startDate": "",
      "endDate": "",
      "currentCompany": false,
      "description": "",
      "bullets": [
        {{
          "bulletText": "",
          "technologies": ""
        }}
      ]
    }}
  ],
  "projects": [
    {{
      "title": "",
      "description": "",
      "techStack": "",
      "githubUrl": "",
      "impactMetrics": ""
    }}
  ]
}}

Resume text:
{resume_text}
"""