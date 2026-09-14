#!/usr/bin/env python3
"""
Export Yale Helix student (fellow) applications into combined PDF reports.

The student counterpart to export_submissions.py. For every application in
Supabase that hasn't been exported yet, this builds a clean, branded PDF of the
answers and appends the applicant's uploaded files. Re-run it whenever you like;
already-exported applications are skipped, so each run only produces the new ones.

Unlike startup submissions (one deck each), a student application can carry up to
three files across three buckets: a resume, an optional previous-work file, and an
optional solution artifact. PDFs and images are appended as pages. Anything else
(.zip, .docx, .pptx) cannot be rendered into a PDF, so the raw file is saved next
to the report under student-submissions/attachments/<application id>/ and the
report says so.

ONE-TIME SETUP
    cd scripts
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    python -m playwright install chromium

RUN
    python export_student_applications.py            # export only new applications
    python export_student_applications.py --force    # re-export everything

Credentials are read from ../.env.local:
    NEXT_PUBLIC_SUPABASE_URL   (or SUPABASE_URL)
    SUPABASE_SERVICE_ROLE_KEY

Output PDFs are written to ../student-submissions/ (gitignored).
"""

from __future__ import annotations

import base64
import html
import io
import re
import sys
from datetime import datetime
from pathlib import Path

import requests
from dotenv import dotenv_values
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pypdf import PdfReader, PdfWriter
from playwright.sync_api import sync_playwright

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
OUT_DIR = ROOT / "student-submissions"
ATTACH_DIR = OUT_DIR / "attachments"

TABLE = "student_applications"

# (key, bucket, path column, filename column, label)
ATTACHMENTS = [
    ("resume", "student-resumes", "resume_path", "resume_filename", "Resume"),
    ("project", "student-projects", "project_path", "project_filename", "Previous work"),
    ("solution", "student-solutions", "solution_path", "solution_filename", "Solution artifact"),
]

IMAGE_MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
}

env = {**dotenv_values(ROOT / ".env.local")}
# .strip() because the URL in .env.local is stored with a leading space.
SUPABASE_URL = (env.get("NEXT_PUBLIC_SUPABASE_URL") or env.get("SUPABASE_URL") or "").strip().rstrip("/")
SERVICE_KEY = (env.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()

if not SUPABASE_URL or not SERVICE_KEY:
    sys.exit(
        "Missing credentials. Set NEXT_PUBLIC_SUPABASE_URL and "
        "SUPABASE_SERVICE_ROLE_KEY in .env.local."
    )

AUTH = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}


def fetch_rows():
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=*&order=created_at.asc"
    r = requests.get(url, headers=AUTH, timeout=60)
    r.raise_for_status()
    return r.json()


def download(bucket: str, path: str) -> bytes:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    r = requests.get(url, headers=AUTH, timeout=180)
    r.raise_for_status()
    return r.content


def human_date(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone()
        return dt.strftime("%B %-d, %Y at %-I:%M %p")
    except Exception:
        return iso or ""


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (text or "applicant").lower()).strip("-") or "applicant"


def count_words(text) -> int:
    return len((text or "").split())


def field(label: str, value, limit: int | None = None):
    """One row in the report. Adds a word count when the form imposed a limit."""
    if not limit or not value:
        return (label, value, "", False)
    words = count_words(value)
    return (label, value, f"{words} / {limit} words", words > limit)


def build_sections(row: dict):
    retreat = row.get("retreat_commitment") or ""
    other = (row.get("retreat_commitment_other") or "").strip()
    if other:
        retreat = f"{retreat} - {other}" if retreat else other

    return [
        (
            "Section 2 - Resume & previous work",
            [
                field("Portfolio / GitHub / website", row.get("portfolio_link")),
                field("Description of shared work and individual contribution", row.get("project_description"), 100),
            ],
        ),
        (
            "Section 3 - Getting to know you",
            [
                field(
                    "Why Yale Helix, and what they hope to get out of working with an early-stage startup",
                    row.get("why_helix"),
                    100,
                ),
                field(
                    "Skills, experiences, or perspectives they would bring to a Helix startup team",
                    row.get("skills_experience"),
                    100,
                ),
                field(
                    "Something they built, improved, researched, organized, or helped solve",
                    row.get("proud_project"),
                    150,
                ),
            ],
        ),
        (
            "Section 4 - Helix startup challenge (Noma)",
            [
                field(
                    "Imagine Noma has brought you onto its team for the next month. What would you do?",
                    row.get("noma_challenge"),
                    300,
                ),
            ],
        ),
        (
            "Section 5 - Optional: bring your solution to life",
            [
                field("Supporting link", row.get("solution_link")),
                field("What we are looking at and how it relates to the proposed solution", row.get("solution_description"), 75),
            ],
        ),
        (
            "Section 6 - Final information",
            [
                field("Anything else they would like us to know", row.get("additional_info"), 100),
                field("Able to commit to the program (4-8 hours per week)", row.get("commitment_level")),
                field("Able to attend the retreat, October 2-4", retreat),
            ],
        ),
    ]


def image_to_pdf(browser, data: bytes, mime: str, caption: str) -> bytes:
    """Render an uploaded image as a single PDF page so it can be appended."""
    encoded = base64.b64encode(data).decode()
    page_html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
      @page {{ size: Letter; margin: 12mm; }}
      body {{ margin: 0; font-family: sans-serif; }}
      .cap {{ font-size: 10px; color: #5b6573; margin-bottom: 8px; }}
      img {{ max-width: 100%; max-height: 235mm; object-fit: contain; display: block; margin: 0 auto; }}
    </style></head><body>
      <div class="cap">{html.escape(caption)}</div>
      <img src="data:{mime};base64,{encoded}" />
    </body></html>"""

    page = browser.new_page()
    page.set_content(page_html, wait_until="load")
    pdf = page.pdf(format="Letter", print_background=True)
    page.close()
    return pdf


def collect_attachments(browser, row: dict):
    """
    Returns (pdf_parts, appended_labels, aside_labels, raw_files).

    pdf_parts  - PDF bytes to append, in order
    raw_files  - (filename, bytes) that could not be rendered and must be saved as-is
    """
    pdf_parts, appended, aside, raw_files = [], [], [], []

    for _key, bucket, path_col, name_col, label in ATTACHMENTS:
        path = (row.get(path_col) or "").strip()
        if not path:
            continue

        filename = (row.get(name_col) or "").strip() or path.split("/")[-1]
        extension = ("." + path.rsplit(".", 1)[-1].lower()) if "." in path else ""
        descriptor = f"{label}: {filename}"

        try:
            data = download(bucket, path)
        except Exception as e:
            print(f"    ! could not download {label.lower()} ({e}); skipping")
            continue

        if extension == ".pdf":
            try:
                PdfReader(io.BytesIO(data))  # validate before committing to append
                pdf_parts.append(data)
                appended.append(descriptor)
            except Exception as e:
                print(f"    ! {label.lower()} is not a readable PDF ({e}); saving raw")
                raw_files.append((filename, data))
                aside.append(descriptor)
        elif extension in IMAGE_MIME:
            try:
                pdf_parts.append(image_to_pdf(browser, data, IMAGE_MIME[extension], descriptor))
                appended.append(descriptor)
            except Exception as e:
                print(f"    ! could not render {label.lower()} image ({e}); saving raw")
                raw_files.append((filename, data))
                aside.append(descriptor)
        else:
            # .zip, .doc, .docx, .ppt, .pptx - keep the original, it cannot become a page.
            raw_files.append((filename, data))
            aside.append(descriptor)

    return pdf_parts, appended, aside, raw_files


def render_info_pdf(jinja_env, browser, row: dict, appended, aside) -> bytes:
    first = (row.get("first_name") or "").strip()
    last = (row.get("last_name") or "").strip()

    app = {
        **row,
        "full_name": " ".join(p for p in (first, last) if p) or row.get("email", ""),
        "submitted_human": human_date(row.get("created_at", "")),
        "areas_of_interest": row.get("areas_of_interest") or [],
    }

    page_html = jinja_env.get_template("student_report_template.html").render(
        app=app,
        sections=build_sections(row),
        appended=appended,
        saved_aside=aside,
        generated_at=datetime.now().strftime("%B %-d, %Y"),
    )

    page = browser.new_page()
    page.set_content(page_html, wait_until="networkidle")  # let web fonts load
    pdf = page.pdf(format="Letter", print_background=True)
    page.close()
    return pdf


def merge(info_pdf: bytes, parts: list[bytes], out_path: Path):
    writer = PdfWriter()
    for p in PdfReader(io.BytesIO(info_pdf)).pages:
        writer.add_page(p)
    for part in parts:
        try:
            for p in PdfReader(io.BytesIO(part)).pages:
                writer.add_page(p)
        except Exception as e:
            print(f"    ! could not append an attachment ({e}); continuing")
    with open(out_path, "wb") as f:
        writer.write(f)


def main():
    force = "--force" in sys.argv
    OUT_DIR.mkdir(exist_ok=True)
    existing = [p.name for p in OUT_DIR.glob("*.pdf")]

    rows = fetch_rows()
    print(f"Found {len(rows)} student application(s) in Supabase.")

    jinja_env = Environment(
        loader=FileSystemLoader(str(SCRIPT_DIR)),
        autoescape=select_autoescape(["html"]),
    )

    new_count = 0
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        try:
            for row in rows:
                rid = row["id"]
                if not force and any(rid in name for name in existing):
                    continue

                who = slugify(f"{row.get('last_name')}-{row.get('first_name')}")
                name = f"{row.get('created_at', '')[:10]}_{who}_{rid}.pdf"
                out_path = OUT_DIR / name
                print(f"  + {row.get('first_name')} {row.get('last_name')}  ->  student-submissions/{name}")

                parts, appended, aside, raw_files = collect_attachments(browser, row)

                if raw_files:
                    target = ATTACH_DIR / rid
                    target.mkdir(parents=True, exist_ok=True)
                    for filename, data in raw_files:
                        safe = re.sub(r"[^A-Za-z0-9._-]+", "_", filename) or "attachment"
                        (target / safe).write_bytes(data)
                        print(f"    . saved {safe} under attachments/{rid}/")

                info_pdf = render_info_pdf(jinja_env, browser, row, appended, aside)
                merge(info_pdf, parts, out_path)
                new_count += 1
        finally:
            browser.close()

    if new_count == 0:
        print("Nothing new to export. You are up to date.")
    else:
        print(f"Done. Exported {new_count} new application(s) to {OUT_DIR}/")


if __name__ == "__main__":
    main()
