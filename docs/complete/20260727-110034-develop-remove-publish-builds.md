# Remove GitLab CI Publish Builds

**Started**: 2026-07-27 11:00:34

## Summary

Remove the three broken `publish` stage jobs (`publish_init`, `publish_server`, `publish_client`) from `.gitlab-ci.yml`, along with the `publish` stage declaration and the `DOCKER_BUILDKIT` variable that was only used by those jobs.

No design doc existed; proceeding directly from user description.

---

## 2026-07-27 11:00:34 — Edit `.gitlab-ci.yml`

**Files changed**: `.gitlab-ci.yml`

Removed:
- `DOCKER_BUILDKIT: 1` variable
- `publish` from the `stages:` list
- `publish_init` job (lines 71–88)
- `publish_server` job (lines 90–107)
- `publish_client` job (lines 109–126)

**Result**: pass
