import json


def build_resume_tailoring_prompt(
        jd_analysis: dict,
        summary: str,
        skills: list,
        experiences: list,
        projects: list
) -> str:

    return f"""
You are an expert resume writer and ATS optimization specialist.

Your job is to tailor a candidate's resume specifically for a job, maximizing ATS score and relevance.

JD Analysis:
{json.dumps(jd_analysis, indent=2)}

Candidate's Current Resume:

Summary:
{summary}

Skills:
{json.dumps(skills, indent=2)}

Experiences:
{json.dumps(experiences, indent=2)}

Projects:
{json.dumps(projects, indent=2)}

Instructions:
- Rewrite the summary to align with the job requirements and use ATS keywords naturally.
- Select only the most relevant skills from the candidate's skill list that match required or preferred skills.
- Rewrite experience bullet points to highlight relevant work and include ATS keywords. Do NOT invent experience that doesn't exist — only reframe what's there.
- Select the most relevant projects and rewrite descriptions to align with the JD.
- atsKeywordsUsed should list all ATS keywords you successfully incorporated.
- matchScore should be an integer 0-100 reflecting how well the candidate's background matches the JD after tailoring.

Return ONLY valid JSON with this exact structure:

{{
  "tailoredSummary": "",
  "tailoredSkills": [],
  "tailoredExperiences": [
    {{
      "companyName": "",
      "role": "",
      "bullets": [
        {{
          "bulletText": "",
          "technologies": ""
        }}
      ]
    }}
  ],
  "tailoredProjects": [
    {{
      "title": "",
      "description": "",
      "techStack": "",
      "impactMetrics": ""
    }}
  ],
  "atsKeywordsUsed": [],
  "matchScore": 0
}}

Rules:
- Return only JSON.
- No markdown.
- No explanation.
- Match the schema exactly.
"""