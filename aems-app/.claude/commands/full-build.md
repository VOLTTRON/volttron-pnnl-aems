---
description: Run the full prisma → common → server → client build chain
---

Run [build.sh](../../build.sh) (POSIX) or [build.ps1](../../build.ps1) (PowerShell on Windows) from the repo root. This builds in order: prisma → common → server → client.

If $ARGUMENTS is non-empty, pass them through (e.g., `-c` for clean build, `-d` for skip dependencies, `-m` for skip migrations). Otherwise run with no flags.

While it runs, surface only failures and the final status. Don't dump full success output — the script is verbose and the user just needs to know what worked and what didn't.

If a step fails, identify which workspace failed and the root error. Suggest a targeted next action (e.g., "common/ failed because @local/prisma export X doesn't exist — check that prisma/ generated correctly").
