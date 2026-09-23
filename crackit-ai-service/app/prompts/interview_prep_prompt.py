def get_interview_prep_prompt(data: dict) -> str:
    job_title = data.get("jobTitle", "")
    company_name = data.get("companyName", "")
    required_skills = ", ".join(data.get("requiredSkills", []))
    preferred_skills = ", ".join(data.get("preferredSkills", []))
    important_topics = ", ".join(data.get("importantTopics", []))
    experience_level = data.get("experienceLevel", "")
    ai_summary = data.get("aiSummary", "")
    user_skills = ", ".join(data.get("userSkills", []))
    user_experiences = ", ".join(data.get("userExperiences", []))

    return f"""
You are an expert interview coach and technical recruiter with deep knowledge of hiring processes at top tech companies.

Generate a comprehensive interview preparation plan for the following:

JOB DETAILS:
- Role: {job_title}
- Company: {company_name}
- Experience Level: {experience_level}
- Job Summary: {ai_summary}
- Required Skills: {required_skills}
- Preferred Skills: {preferred_skills}
- Important Topics: {important_topics}

CANDIDATE PROFILE:
- Skills: {user_skills}
- Experience: {user_experiences}

YOUR TASK:
Based on the job details AND your knowledge of what {company_name} and similar companies typically ask for {job_title} roles, generate:

1. TOPICS to study — prioritized by importance, grouped by category
2. INTERVIEW QUESTIONS — mix of technical, behavioral, and situational questions that are commonly asked for this role and company

For topics, think about:
- Core technical concepts required
- System design topics if relevant
- Behavioral competencies the company values
- Common gap areas based on candidate vs JD

For questions, think about:
- What {company_name} is known to ask
- Role-specific technical depth
- Behavioral questions using STAR format
- Questions that test the required skills

Respond ONLY with a valid JSON object, no markdown, no explanation, exactly this structure:
{{
  "topics": [
    {{
      "topic": "topic name",
      "category": "Technical | Behavioral | System Design | Domain Knowledge",
      "description": "what to study and why it matters for this role"
    }}
  ],
  "questions": [
    {{
      "question": "the interview question",
      "type": "Technical | Behavioral | Situational",
      "difficulty": "Easy | Medium | Hard",
      "suggestedAnswer": "a strong answer tailored to the candidate's background"
    }}
  ]
}}

Generate at least 6 topics and 12 questions. Prioritize topics by importance (most critical first).
"""