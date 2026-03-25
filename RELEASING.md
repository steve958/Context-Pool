# Releasing a New Version

This document covers how to push code changes so they are automatically built and published to Docker Hub, making them available to all users running `docker-compose.hub.yml`.

---

## How it works

```
Code change → git push → GitHub Actions → Docker Hub
```

The workflow in `.github/workflows/docker-publish.yml` triggers on every push to `main` and on every version tag (`v*`). It builds both images for `linux/amd64` and `linux/arm64` and pushes them to:

- `steve958/context-pool-backend`
- `steve958/context-pool-frontend`

Users running `docker-compose -f docker-compose.hub.yml pull && docker-compose -f docker-compose.hub.yml up -d` will always get the latest images.

---

## Workflow for every change

### 1. Make and test your changes locally

```bash
cd "c:\Users\StefanMiljevic\Documents\Context Pool"

# Build and run locally to verify the change works
docker-compose up --build
```

Test manually or run through the key flows (upload a doc, run a query, check results).

### 2. Commit your changes

```bash
git add <changed files>
git commit -m "fix: brief description of what changed"
```

Follow this commit prefix convention:
| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Maintenance (deps, config) |
| `ci:` | CI/CD changes |

### 3. Push to main

```bash
git push
```

This triggers a Docker Hub build automatically. The `:latest` tag on both images is updated within ~5–10 minutes.

**Users get the update by running:**
```bash
docker-compose -f docker-compose.hub.yml pull
docker-compose -f docker-compose.hub.yml up -d
```

---

## Releasing a named version (recommended for significant changes)

For meaningful milestones, create a version tag. This produces versioned images (e.g., `:v1.1.0`) alongside `:latest`, so users can pin to a specific version.

```bash
# Make sure main is clean and pushed first
git status

# Create and push the tag
git tag v1.1.0
git push origin v1.1.0
```

This triggers a separate build that publishes:
- `steve958/context-pool-backend:v1.1.0`
- `steve958/context-pool-backend:1.1`
- `steve958/context-pool-backend:latest`

### Versioning convention

Use [Semantic Versioning](https://semver.org):

| Change type | Example | When to use |
|---|---|---|
| Patch `v1.0.x` | `v1.0.1` | Bug fixes, no new features |
| Minor `v1.x.0` | `v1.1.0` | New features, backwards compatible |
| Major `vX.0.0` | `v2.0.0` | Breaking changes to API or config format |

---

## Monitoring a build

After pushing, watch the build at:

```
https://github.com/steve958/Context-Pool/actions
```

A green checkmark means the images are live on Docker Hub. A red ✕ means something failed — click the run to see the logs.

---

## How users update

Users running the Hub images only need to run two commands:

```bash
# Pull the latest images
docker-compose -f docker-compose.hub.yml pull

# Restart containers with the new images (zero-downtime-style: old containers stop, new ones start)
docker-compose -f docker-compose.hub.yml up -d
```

Documents and config are stored in Docker volumes and are **not affected** by image updates.

---

## If you need to roll back

If a bad build reaches Docker Hub, roll back by tagging the previous commit and pushing:

```bash
# Find the last good commit
git log --oneline -10

# Tag it as the new patch release
git tag v1.0.2 <commit-hash>
git push origin v1.0.2

# Optionally force-move latest back to that commit's image on Docker Hub manually
# via hub.docker.com → repository → tags
```

---

## Quick reference

| Goal | Command |
|---|---|
| Push a fix (updates `:latest`) | `git push` |
| Release a named version | `git tag vX.Y.Z && git push origin vX.Y.Z` |
| Check build status | `https://github.com/steve958/Context-Pool/actions` |
| Verify image is live | `docker pull steve958/context-pool-backend:latest` |
| User update command | `docker-compose -f docker-compose.hub.yml pull && docker-compose -f docker-compose.hub.yml up -d` |
