# AEMS Software Deployment Guide — Source Tree

This directory holds the Markdown source, figures, and pandoc tooling for the **AEMS Software Deployment Guide**, a companion document to:

- *AEMS Building Installer Configuration User Guide (2025-06-26).docx* (repo root)
- *AEMS Building Owner and Occupant User Guide (2025-06-26).docx* (repo root)

The deployment guide bridges those two: it gets the host OS ready, installs Docker, brings the AEMS Compose stack up, and hands off cleanly to the installer guide for VOLTTRON/BACnet/thermostat setup and to the owner guide for runtime UI use.

## Files

```
aems-deployment-guide.md                   # Markdown source (single file)
figures/                                   # PNG figures + this dir's README
figures/README.md                          # Capture targets and filenames
pandoc/                                    # Build tooling
pandoc/build-deployment-guide.sh           # Linux / Pi / macOS / Git Bash builder
pandoc/build-deployment-guide.ps1          # Windows PowerShell builder
pandoc/aems-pnnl-reference.docx            # PNNL house-style reference (to be generated — see below)
```

## Build

From the repository root, with `pandoc` installed:

```bash
# Linux / Pi / macOS / Git Bash
./docs/proposed/aems-deployment-guide/pandoc/build-deployment-guide.sh

# Windows PowerShell
.\docs\proposed\aems-deployment-guide\pandoc\build-deployment-guide.ps1
```

The output `.docx` lands at the repository root as `AEMS Software Deployment Guide (YYYY-MM-DD).docx`, alongside the existing two PNNL guides.

## Reference doc

`pandoc/aems-pnnl-reference.docx` defines the PNNL house style (cover, headings, monospace, captions). It is **not yet generated**. To produce it:

1. Generate a baseline:
   ```bash
   pandoc --print-default-data-file reference.docx > pandoc/aems-pnnl-reference.docx
   ```
2. Open it in Word.
3. Apply PNNL styles to: Title, Heading 1 / 2 / 3, Body Text, Source Code, Caption, Hyperlink. Copy the cover-page layout from one of the existing two PNNL `.docx` guides if possible.
4. Save.

Once present, `build-deployment-guide.sh` and `.ps1` pick it up automatically. Without it the script still builds, but the output uses pandoc's default style.

## Status

`docs/proposed/` is the authoring location per the repo's docs-lifecycle convention. Once accepted, move the directory to `docs/complete/` with a date prefix following the pattern used in `docs/complete/`.

## Verification

The plan file at `~/.claude/plans/using-the-two-word-async-pancake.md` lists the V1–V5 verification rigs (clean Ubuntu VM, clean Windows 11 + Docker Desktop, Raspberry Pi 5 hardware, pandoc tooling check, hand-off integration). Walk all five before declaring v1.0.
