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

### 2. Update the promo website (REQUIRED for new features)

**Rule:** Every new feature must be integrated into the "New in X.X.X" section on the promo website.

See [WEBSITE_FEATURE_INTEGRATION.md](./WEBSITE_FEATURE_INTEGRATION.md) for complete guidelines.

**Quick checklist:**
- [ ] Feature added to `website/src/components/NewInVersion.tsx`
- [ ] Version number and date updated
- [ ] Nav badge updated in `website/src/components/Nav.tsx` (line 23)
- [ ] Feature detail page created (optional but recommended)
- [ ] Test website build: `cd website && npm run build`

**Example - Adding to NewInVersion.tsx:**
```typescript
{
  version: "1.4.0",
  date: "March 2026",
  isLatest: true,
  features: [
    {
      id: "your-feature-id",
      icon: "🚀",
      title: "Your Feature Name",
      description: "What it does for users...",
      highlights: [
        "Key benefit 1",
        "Key benefit 2",
        "Key benefit 3"
      ],
      docsLink: "/docs/your-feature"
    }
  ]
}
```

### 3. Commit your changes

```bash
git add <changed files>
git commit -m "feat: brief description of what changed"
```

Follow this commit prefix convention:
| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Maintenance (deps, config) |
| `ci:` | CI/CD changes |

### 4. Push to main

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

### Pre-release checklist

Before tagging, ensure:
- [ ] All features are merged to `main`
- [ ] Website updated with new features in `NewInVersion.tsx`
- [ ] Nav badge shows correct version
- [ ] Tests pass locally
- [ ] Documentation updated

### Create and push the tag

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

---

## Website Integration Checklist

For every release with user-facing changes:

```bash
# 1. Update NewInVersion.tsx with new features
# 2. Update Nav.tsx badge version
# 3. Test website build
cd website
npm run build

# 4. Commit website changes
git add website/
git commit -m "docs(website): add vX.Y.Z to NewInVersion section"

# 5. Push and tag
git push
git tag vX.Y.Z
git push origin vX.Y.Z
```

See [WEBSITE_FEATURE_INTEGRATION.md](./WEBSITE_FEATURE_INTEGRATION.md) for detailed guidelines.
