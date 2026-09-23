import json


def build_jd_analysis_prompt(
        jd_text: str,
        summary: str,
        skills: list,
        experiences: list,
        projects: list
) -> str:

    has_resume = any([summary, skills, experiences, projects])

    resume_section = ""
    if has_resume:
        resume_section = f"""
Candidate Resume:

Summary:
{summary if summary else "Not provided"}

Skills:
{json.dumps([s.dict() if hasattr(s, 'dict') else s for s in skills], indent=2)}

Experiences:
{json.dumps([e.dict() if hasattr(e, 'dict') else e for e in experiences], indent=2)}

Projects:
{json.dumps([p.dict() if hasattr(p, 'dict') else p for p in projects], indent=2)}
"""

    match_score_instruction = """
matchScore:
- Integer 0 to 100
- Based on how well the candidate's full profile matches the job
- Consider: skill overlap, experience relevance and seniority, project tech stack alignment, summary domain match
- Weight: required skills 40%, experience 35%, projects 15%, summary 10%
- If no resume provided, return 0
""" if has_resume else "matchScore: return 0 as no resume was provided"

    return f"""
You are an expert technical recruiter and ATS optimization specialist.

Analyze the following job description and evaluate the candidate's fit.

{resume_section}

Return ONLY valid JSON with this exact structure:

{{
  "requiredSkills": [],
  "preferredSkills": [],
  "experienceLevel": "",
  "importantTopics": [],
  "atsKeywords": [],
  "summary": "",
  "matchScore": 0
}}

{match_score_instruction}

Rules:
- Return only JSON.
- No markdown.
- No explanation.
- Match the schema exactly.
- Experience level should be Valid one word experience

Job Description:
{jd_text}
"""