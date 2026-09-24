import json

def get_roadmap_prompt(data: dict) -> str:
    current_role = data.get("current_role", "Software Engineer")
    years_of_experience = data.get("years_of_experience", 2)
    current_skills = data.get("current_skills", [])
    current_compensation = data.get("current_compensation", "Not specified")
    target_role = data.get("target_role", "Senior Software Engineer")
    target_compensation = data.get("target_compensation", "Not specified")
    target_timeline_weeks = data.get("target_timeline_weeks", 8)
    target_company_types = data.get("target_company_types", ["Product Startups", "Unicorns", "Top Tech MNCs"])

    skills_str = ", ".join(current_skills) if isinstance(current_skills, list) else str(current_skills)
    company_types_str = ", ".join(target_company_types) if isinstance(target_company_types, list) else str(target_company_types)

    return f"""You are the Lead Staff Principal Engineering Career Coach and Tech Hiring Bar-Raiser.
Your goal is to build a high-precision, no-fluff, non-generic Career Preparation Roadmap and Target Company Compatibility Matrix.

### CANDIDATE INPUT PROFILE:
- Current Role: {current_role}
- Years of Experience: {years_of_experience} years
- Current Skills & Stack: {skills_str}
- Current Compensation/Tier: {current_compensation}
- Target Role: {target_role}
- Target Package/Tier: {target_compensation}
- Target Timeline: {target_timeline_weeks} weeks
- Target Company Categories: {company_types_str}

---

### CORE PRINCIPLES (AVOID GENERIC FLUFF):
1. NO GENERIC TUTORIAL BULLETS:
   - FORBIDDEN: "Learn Spring Boot basics", "Read a book on system design", "Practice DSA".
   - REQUIRED: Pinpoint the exact technical delta between their current stack and what hiring bars demand for {target_role} at top-tier compensation. For example: "Upgrade from @Transactional annotations to manual distributed transaction patterns (Saga / 2PC), database connection pool exhaustion diagnosis, and B+Tree composite index selectivity".
2. REALISTIC GAP ANALYSIS:
   - Differentiate between:
     a) Direct Knowledge Gaps (must learn and build hands-on proof-of-work for).
     b) Transferable Strengths (existing skills they already possess that map directly to the target role).
     c) Elimination Dealbreakers (the exact rounds or topics that cause 80% of candidates to get rejected at the target tier, e.g. 90-min Machine Coding/LLD, Concurrency race conditions, Kafka partition skew).
3. TARGET COMPANY COMPATIBILITY:
   - Provide 4 to 6 specific, recognizable companies or high-growth tech archetypes in the target market that actively hire this profile.
   - For each company, state:
     - Match Score (0 to 100 based on their tech stack affinity).
     - Category (e.g. "Fintech Unicorn", "High-Scale E-Commerce", "Global SaaS Leader", "Infrastructure/Cloud").
     - Exactly WHY they match this profile.
     - Typical interview process breakdown (e.g. Round 1: Machine Coding 90m, Round 2: HLD, Round 3: HM).
     - The top 3 priority focus areas tested by that specific company.
4. ACTIONABLE TIMELINE (WEEK-BY-WEEK MILESTONES):
   - Divide the {target_timeline_weeks} weeks into 4 structured milestone phases.
   - Every topic within a milestone must have:
     - A clear, non-generic topic title.
     - Key concepts to master.
     - A concrete hands-on practice task / mini-project (what they should build or benchmark to prove mastery).
     - Estimated hours required.

---

### REQUIRED JSON OUTPUT FORMAT:
Return ONLY valid, parseable JSON with NO surrounding conversational text, strictly matching this structure:

{{
  "readiness": {{
    "overallScore": 75,
    "verdict": "Realistic transition within {target_timeline_weeks} weeks if Machine Coding and Distributed Data systems are prioritized.",
    "marketDemand": "VERY_HIGH",
    "estimatedWeeks": {target_timeline_weeks},
    "salaryUpliftPotential": "2.0x - 2.8x"
  }},
  "skillGaps": {{
    "directGaps": [
      {{
        "skill": "<Specific Skill / Architecture Area>",
        "severity": "CRITICAL",
        "description": "<Exact delta explanation>"
      }}
    ],
    "transferableStrengths": [
      {{
        "skill": "<Existing Skill>",
        "leverage": "<How to position and leverage this in interviews>"
      }}
    ],
    "dealbreakersForTargetTier": [
      {{
        "topic": "<Specific Elimination Topic>",
        "why": "<Why candidates get rejected if they fail this>"
      }}
    ]
  }},
  "milestones": [
    {{
      "milestoneNumber": 1,
      "title": "<Milestone Title>",
      "weekSpan": "Weeks 1 - 2",
      "objective": "<Core milestone outcome>",
      "topics": [
        {{
          "id": "m1-t1",
          "title": "<Specific Topic Title>",
          "keyConcepts": "<Specific concepts, algorithms, tools>",
          "practiceTask": "<Concrete project/coding drill to build>",
          "estimatedHours": 10
        }}
      ]
    }}
  ],
  "compatibleCompanies": [
    {{
      "companyName": "<Company Name or Archetype>",
      "category": "<Category>",
      "matchScore": 88,
      "whyMatched": "<Why candidate's stack aligns with their tech stack>",
      "interviewRounds": [
        "<Round 1 name and focus>",
        "<Round 2 name and focus>",
        "<Round 3 name and focus>"
      ],
      "priorityTopics": ["<Topic 1>", "<Topic 2>", "<Topic 3>"]
    }}
  ],
  "actionPlanFirst48Hours": [
    "<Action item 1>",
    "<Action item 2>",
    "<Action item 3>"
  ]
}}
"""
