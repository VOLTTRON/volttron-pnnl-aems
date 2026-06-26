#!/usr/bin/env bash
# Build the AEMS Software Deployment Guide .docx from Markdown source.
# Run from the repository root.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "${REPO_ROOT}"

SRC="docs/proposed/aems-deployment-guide/aems-deployment-guide.md"
REF="docs/proposed/aems-deployment-guide/pandoc/aems-pnnl-reference.docx"
FIGURES="docs/proposed/aems-deployment-guide/figures"
OUT="AEMS Software Deployment Guide ($(date +%Y-%m-%d)).docx"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "pandoc not found on PATH. Install pandoc and re-run." >&2
  echo "  Ubuntu / Pi:  sudo apt install pandoc" >&2
  echo "  macOS:        brew install pandoc" >&2
  echo "  Windows:      winget install --id JohnMacFarlane.Pandoc" >&2
  exit 1
fi

REF_ARG=()
if [[ -f "${REF}" ]]; then
  REF_ARG=(--reference-doc="${REF}")
else
  echo "NOTE: reference doc ${REF} not found; using pandoc defaults." >&2
  echo "      The .docx will not match PNNL house style until the reference doc is generated." >&2
fi

pandoc \
  "${SRC}" \
  "${REF_ARG[@]}" \
  --toc --toc-depth=3 \
  --number-sections \
  --resource-path="${FIGURES}" \
  -o "${OUT}"

echo "Wrote: ${OUT}"
