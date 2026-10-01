# AEMS app

This repository runs on reach. These documents are the whole of the instructions:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — the spine. It outranks every other document.
- [docs/TRAPS.md](docs/TRAPS.md) — read the section for the area you are touching before you touch it.
- [docs/roster.md](docs/roster.md) and [docs/units/](docs/units/) — what the software does, as claims,
  and what proves each one.

The workflows are `/reach:ideate` (decide and write down), `/reach:build` (build what is unbuilt) and
`/reach:milestone` (what only a person can verify). There are no others.

Verify from the repository root with `powershell -File scripts/reach.ps1 gate` (the documents) and
`powershell -File scripts/reach.ps1 all` (gate and every tier). The previous instructions are archived,
read-only, in [Reference/](Reference/).
