from datetime import datetime
from weasyprint import HTML


class ResumePdfService:

    def generate_pdf(self, data: dict, template: str = "classic") -> bytes:
        if template == "modern":
            html = self._build_modern(data)
        else:
            html = self._build_classic(data)
        return HTML(string=html).write_pdf()

    # ─── Shared helpers ──────────────────────────────────────────────────────

    def _fmt_date(self, date_str: str) -> str:
        if not date_str:
            return ""
        try:
            dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
            return dt.strftime("%b %Y")
        except:
            return date_str

    def _contact_parts(self, d: dict) -> list:
        parts = []
        if d.get("email"):    parts.append(d["email"])
        if d.get("phone"):    parts.append(d["phone"])
        if d.get("location"): parts.append(d["location"])
        if d.get("linkedinUrl"): parts.append(f'<a href="{d["linkedinUrl"]}">LinkedIn</a>')
        if d.get("githubUrl"):   parts.append(f'<a href="{d["githubUrl"]}">GitHub</a>')
        return parts

    def _skills_by_category(self, skills: list) -> dict:
        grouped: dict[str, list] = {}
        for s in skills:
            cat = s.get("category") or "Other"
            grouped.setdefault(cat, []).append(s.get("skillName", ""))
        return grouped

    def _exp_html(self, experiences: list, bullet_style: str = "disc") -> str:
        html = ""
        for exp in experiences:
            start = self._fmt_date(exp.get("startDate", ""))
            end = "Present" if exp.get("currentCompany") or exp.get("current") else self._fmt_date(exp.get("endDate", ""))
            date_range = f"{start} – {end}" if start else ""
            location = exp.get("location", "")

            bullets_html = ""
            for b in exp.get("bullets", []):
                text = b.get("bulletText", "") if isinstance(b, dict) else str(b)
                if text:
                    bullets_html += f"<li>{text}</li>"

            html += f"""
            <div class="entry">
                <div class="entry-header">
                    <div class="entry-left">
                        <span class="entry-title">{exp.get("role", exp.get("jobTitle", ""))}</span>
                        <span class="entry-sub">{exp.get("companyName", exp.get("company", ""))}{" · " + location if location else ""}</span>
                    </div>
                    <span class="entry-date">{date_range}</span>
                </div>
                {"<ul>" + bullets_html + "</ul>" if bullets_html else ""}
            </div>
            """
        return html

    def _proj_html(self, projects: list) -> str:
        html = ""
        for p in projects:
            name = p.get("title", p.get("projectName", ""))
            tech = p.get("techStack", "")
            desc = p.get("description", "")
            impact = p.get("impactMetrics", "")
            bullets_html = ""
            for b in p.get("bullets", []):
                text = b.get("bulletText", "") if isinstance(b, dict) else str(b)
                if text:
                    bullets_html += f"<li>{text}</li>"

            html += f"""
            <div class="entry">
                <div class="entry-header">
                    <div class="entry-left">
                        <span class="entry-title">{name}</span>
                        {"<span class='entry-tech'>" + tech + "</span>" if tech else ""}
                    </div>
                </div>
                {"<p class='entry-desc'>" + desc + "</p>" if desc else ""}
                {"<ul>" + bullets_html + "</ul>" if bullets_html else ""}
                {"<p class='entry-impact'>" + impact + "</p>" if impact else ""}
            </div>
            """
        return html

    # ─── Template 1: Classic ─────────────────────────────────────────────────
    # Clean single-column, ATS-safe, matches your original resume style

    def _build_classic(self, d: dict) -> str:
        full_name   = d.get("fullName", "")
        summary     = d.get("summary", "")
        skills      = d.get("skills", [])
        experiences = d.get("experiences", [])
        projects    = d.get("projects", [])

        contact_parts = self._contact_parts(d)
        contact_html  = " · ".join(contact_parts)

        # Skills grouped by category
        grouped = self._skills_by_category(skills)
        skills_html = ""
        for cat, names in grouped.items():
            if cat and cat.lower() != "other":
                skills_html += f'<div class="skill-row"><span class="skill-cat">{cat}:</span> {", ".join(names)}</div>'
        # dump "Other" or uncategorised at end
        other = grouped.get("Other", []) + grouped.get("", [])
        if other:
            skills_html += f'<div class="skill-row"><span class="skill-cat">Other:</span> {", ".join(other)}</div>'

        exp_html  = self._exp_html(experiences)
        proj_html = self._proj_html(projects)

        def section(title, body):
            if not body.strip():
                return ""
            return f"""
            <div class="section">
                <div class="section-title">{title}</div>
                {body}
            </div>"""

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    line-height: 1.5;
    padding: 32pt 44pt;
  }}

  /* Header */
  .header {{ margin-bottom: 14pt; border-bottom: 1.5pt solid #1a1040; padding-bottom: 10pt; }}
  .name {{ font-size: 20pt; font-weight: 700; color: #1a1040; letter-spacing: -0.3pt; margin-bottom: 5pt; }}
  .contact {{ font-size: 9pt; color: #444; }}
  .contact a {{ color: #5b21b6; text-decoration: none; }}

  /* Sections */
  .section {{ margin-bottom: 13pt; }}
  .section-title {{
    font-size: 8.5pt; font-weight: 700; color: #1a1040;
    text-transform: uppercase; letter-spacing: 1pt;
    border-bottom: 0.75pt solid #ccc;
    padding-bottom: 2pt; margin-bottom: 7pt;
  }}

  /* Summary */
  .summary-text {{ font-size: 9.5pt; color: #333; line-height: 1.6; }}

  /* Skills */
  .skill-row {{ font-size: 9.5pt; color: #333; margin-bottom: 3pt; }}
  .skill-cat {{ font-weight: 700; color: #1a1040; }}

  /* Entries */
  .entry {{ margin-bottom: 10pt; }}
  .entry-header {{
    display: flex; justify-content: space-between;
    align-items: flex-start; margin-bottom: 2pt;
  }}
  .entry-left {{ display: flex; flex-direction: column; }}
  .entry-title {{ font-size: 10pt; font-weight: 700; color: #1a1040; }}
  .entry-sub {{ font-size: 9pt; color: #555; margin-top: 1pt; }}
  .entry-tech {{ font-size: 9pt; color: #5b21b6; margin-top: 1pt; }}
  .entry-date {{ font-size: 9pt; color: #666; white-space: nowrap; margin-left: 10pt; flex-shrink: 0; }}
  .entry-desc {{ font-size: 9.5pt; color: #333; margin-top: 3pt; line-height: 1.5; }}
  .entry-impact {{ font-size: 9pt; color: #666; font-style: italic; margin-top: 2pt; }}

  ul {{ margin-top: 4pt; margin-left: 16pt; }}
  ul li {{ font-size: 9.5pt; color: #333; margin-bottom: 2pt; line-height: 1.5; }}
</style>
</head>
<body>

<div class="header">
  <div class="name">{full_name}</div>
  <div class="contact">{contact_html}</div>
</div>

{section("Professional Summary", f"<p class='summary-text'>{summary}</p>" if summary else "")}
{section("Skills", skills_html)}
{section("Experience", exp_html)}
{section("Projects", proj_html)}

</body>
</html>"""

    # ─── Template 2: Modern ──────────────────────────────────────────────────
    # Purple left accent, name in large bold, slightly more visual

    def _build_modern(self, d: dict) -> str:
        full_name   = d.get("fullName", "")
        summary     = d.get("summary", "")
        skills      = d.get("skills", [])
        experiences = d.get("experiences", [])
        projects    = d.get("projects", [])

        contact_parts = self._contact_parts(d)
        contact_html  = "  <span class='dot'>·</span>  ".join(contact_parts)

        grouped = self._skills_by_category(skills)
        skills_html = ""
        for cat, names in grouped.items():
            label = cat if cat and cat.lower() != "other" else "Other"
            skills_html += f'<div class="skill-row"><span class="skill-cat">{label}</span><span class="skill-names">{", ".join(names)}</span></div>'

        exp_html  = self._exp_html(experiences)
        proj_html = self._proj_html(projects)

        def section(title, body):
            if not body.strip():
                return ""
            return f"""
            <div class="section">
                <div class="section-header">
                    <div class="section-bar"></div>
                    <div class="section-title">{title}</div>
                </div>
                {body}
            </div>"""

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    line-height: 1.5;
    padding: 36pt 44pt;
  }}

  /* Header */
  .header {{
    margin-bottom: 18pt;
    padding-bottom: 14pt;
    border-bottom: 2pt solid #7c3aed;
  }}
  .name {{
    font-size: 24pt; font-weight: 700;
    color: #1a1040; letter-spacing: -0.5pt; margin-bottom: 6pt;
  }}
  .name span {{ color: #7c3aed; }}
  .contact {{ font-size: 9pt; color: #555; }}
  .contact a {{ color: #7c3aed; text-decoration: none; }}
  .dot {{ color: #c4b5fd; }}

  /* Sections */
  .section {{ margin-bottom: 15pt; }}
  .section-header {{ display: flex; align-items: center; gap: 8pt; margin-bottom: 8pt; }}
  .section-bar {{ width: 3pt; height: 14pt; background: #7c3aed; border-radius: 2pt; flex-shrink: 0; }}
  .section-title {{
    font-size: 9pt; font-weight: 700; color: #1a1040;
    text-transform: uppercase; letter-spacing: 1pt;
  }}

  /* Summary */
  .summary-text {{ font-size: 9.5pt; color: #444; line-height: 1.65; }}

  /* Skills */
  .skill-row {{
    display: flex; gap: 8pt;
    font-size: 9.5pt; margin-bottom: 4pt;
    padding: 3pt 6pt; background: #faf8ff;
    border-left: 2pt solid #e4daff; border-radius: 0 4pt 4pt 0;
  }}
  .skill-cat {{ font-weight: 700; color: #5b21b6; min-width: 90pt; flex-shrink: 0; }}
  .skill-names {{ color: #333; }}

  /* Entries */
  .entry {{ margin-bottom: 10pt; }}
  .entry-header {{
    display: flex; justify-content: space-between;
    align-items: flex-start; margin-bottom: 2pt;
  }}
  .entry-left {{ display: flex; flex-direction: column; }}
  .entry-title {{ font-size: 10.5pt; font-weight: 700; color: #1a1040; }}
  .entry-sub {{ font-size: 9pt; color: #7c3aed; margin-top: 1pt; font-weight: 500; }}
  .entry-tech {{ font-size: 9pt; color: #7c3aed; margin-top: 1pt; }}
  .entry-date {{
    font-size: 8.5pt; color: #fff; white-space: nowrap;
    margin-left: 10pt; flex-shrink: 0;
    background: #7c3aed; padding: 2pt 7pt;
    border-radius: 10pt;
  }}
  .entry-desc {{ font-size: 9.5pt; color: #333; margin-top: 3pt; line-height: 1.5; }}
  .entry-impact {{ font-size: 9pt; color: #666; font-style: italic; margin-top: 2pt; }}

  ul {{ margin-top: 4pt; margin-left: 14pt; }}
  ul li {{ font-size: 9.5pt; color: #444; margin-bottom: 2pt; line-height: 1.5; }}
  ul li::marker {{ color: #a78bfa; }}
</style>
</head>
<body>

<div class="header">
  <div class="name">{full_name}</div>
  <div class="contact">{contact_html}</div>
</div>

{section("Professional Summary", f"<p class='summary-text'>{summary}</p>" if summary else "")}
{section("Skills", skills_html)}
{section("Experience", exp_html)}
{section("Projects", proj_html)}

</body>
</html>"""