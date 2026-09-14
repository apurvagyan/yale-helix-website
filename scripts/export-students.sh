#!/usr/bin/env bash
#
# One-command export of new student (fellow) applications to PDF.
# Shares the same Python environment as export.sh; first run sets it up.
# Later runs only generate the applications you don't already have.
# Pass --force to re-export everything.
#
#   ./scripts/export-students.sh        (or: yarn export:students)
#   ./scripts/export-students.sh --force
#
set -euo pipefail
cd "$(dirname "$0")"

VENV=".venv"
if [ ! -d "$VENV" ]; then
  echo "First run: setting up the Python environment (this happens once)..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet -r requirements.txt
  "$VENV/bin/python" -m playwright install chromium
  echo "Setup complete."
fi

exec "$VENV/bin/python" export_student_applications.py "$@"
