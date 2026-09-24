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
Your goal is to build a high-precision, authoritative, non-generic Career Preparation Roadmap, Feasibility Assessment, and Target Company Compatibility Matrix.

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

### CORE PRINCIPLES & REQUIREMENTS:

1. GOAL FEASIBILITY & REALITY CHECK (CRITICAL):
   - Assess whether transitioning from {current_role} ({years_of_experience} yrs) to {target_role} in {target_timeline_weeks} weeks is truly viable.
   - Status must be one of:
     * "REALISTIC" — The gap can be closed within {target_timeline_weeks} weeks with disciplined preparation.
     * "AMBITIOUS_STRETCH" — High risk or steep learning curve; requires 25+ hrs/week and focused execution.
     * "IMPRACTICAL" — The leap in seniority or scope (e.g., Junior to Staff/Principal in <12 weeks) is physically unviable in top-tier hiring bars.
   - If "IMPRACTICAL" or "AMBITIOUS_STRETCH", provide a concrete, respectful "suggestedAdjustment" (e.g. calibrate to a realistic stepping-stone role like SDE-2 or extend timeline to realistic duration) with clear rationale.

2. REVISION OF KNOWN SKILLS (DO NOT IGNORE RESUME STACK):
   - Even if the candidate lists skills in their resume ({skills_str}), top tech interviews test them at an advanced level (e.g. JVM memory layout, lock-free structures, B+Tree indexing, connection pool starvation).
   - The roadmap MUST include revision topics that upgrade their existing skills to hiring bar standards.
   - Mark each topic with "isRevision": true for existing stack deepening, and "isRevision": false for net-new architecture gaps.

3. CONCRETE STEP-BY-STEP PROGRESSIVE CADENCE (MANDATORY 12-16 DETAILED TOPICS):
   - You MUST generate exactly 4 progressive milestone phases.
   - Each milestone MUST have 3 to 4 concrete, granular, in-depth topics (Total of 12 to 16 topics across the entire roadmap).
   - Topics MUST be ordered in strict progressive difficulty:
     * Phase 1 (Weeks 1-2): Core Language Mechanics, Memory Model, Concurrency & Thread Safety, and Bar-Raiser Revision of Candidate's Known Stack ({skills_str}).
     * Phase 2 (Weeks 3-4): Object-Oriented Domain Modeling, Low-Level Design (LLD), Design Patterns, and Timed Machine Coding Drills.
     * Phase 3 (Weeks 5-6): Database Internals, Query Execution Plans, B+Tree Indexing, Transaction Isolation Levels (MVCC), and Redis Caching Strategies.
     * Phase 4 (Weeks 7-8): Event-Driven Architecture (Kafka), High-Level System Design (HLD), Sharding, Distributed Transactions (Saga), and Bar-Raiser Interview Defense.
   - For every topic, provide:
     - "id": unique string e.g. "m1-t1", "m1-t2", ...
     - "title": precise, non-generic technical topic name (e.g. "Thread Safety, CAS & Atomic Variables" NOT "Learn Concurrency").
     - "isRevision": true if revising/elevating their known stack, false if net-new gap.
     - "keyConcepts": specific internals, data structures, protocols, failure modes.
     - "practiceTask": concrete coding drill, mini-project, or benchmark to implement.
     - "estimatedHours": realistic integer (6-16 hours).
     - "interviewQuestions": exactly 2 to 3 real top-tier interview questions with concrete architecture answer hints.
     - "readingResource": canonical engineering paper, blog post, or official doc chapter.

4. NO HIGH-LEVEL JARGON OR GENERIC HAND-WAVING:
   - STRICTLY FORBIDDEN: "Learn basics", "Study system design", "Practice DSA", "Read articles", "Prepare for interviews".
   - MANDATORY: Concrete engineering depth, algorithmic guarantees, edge cases, trade-offs, and failure recovery.

---

### REQUIRED JSON OUTPUT FORMAT:
Return ONLY valid, parseable JSON with NO surrounding conversational text, strictly matching this structure:

{{
  "feasibility": {{
    "status": "REALISTIC",
    "score": 75,
    "verdict": "<Direct, honest bar-raiser assessment of this target and timeline>",
    "gapSeverity": "MODERATE",
    "reasons": [
      "<Key reason regarding scope, seniority leap, or timeline>"
    ],
    "suggestedAdjustment": {{
      "recommendedRole": "{target_role}",
      "recommendedWeeks": {target_timeline_weeks},
      "actionableNote": "<Why this adjustment makes candidate's success significantly higher>"
    }}
  }},
  "readiness": {{
    "overallScore": 75,
    "verdict": "Realistic transition within {target_timeline_weeks} weeks if Machine Coding and Distributed Data systems are prioritized.",
    "marketDemand": "VERY_HIGH",
    "estimatedWeeks": {target_timeline_weeks},
    "salaryUpliftPotential": "1.8x - 2.5x"
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
          "isRevision": false,
          "estimatedHours": 8,
          "keyConcepts": "<Detailed concepts, protocols, internal algorithms>",
          "practiceTask": "<Concrete project/coding drill with benchmark requirements>",
          "readingResource": "<Official docs / RFC / canonical chapter>",
          "interviewQuestions": [
            {{
              "question": "<Specific high-frequency interview question>",
              "answerHint": "<Key architecture points, trade-offs, and failure modes to mention>"
            }},
            {{
              "question": "<Second interview question>",
              "answerHint": "<Key architecture points to mention>"
            }}
          ]
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

