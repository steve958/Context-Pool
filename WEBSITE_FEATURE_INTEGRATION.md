# Website Feature Integration Guidelines

**Rule:** Every new feature must be integrated into a dedicated "New in X.X.X" section on the promo website.

---

## Overview

To keep users informed about new capabilities and drive adoption, every significant feature must be:
1. Documented in the `website/src/components/NewInVersion.tsx` component
2. Highlighted on the homepage with a version badge
3. Linked to full documentation

---

## When to Add to "New in X.X.X"

| Change Type | Add to Section? | Notes |
|-------------|-----------------|-------|
| **New feature** | ✅ Required | Any user-visible functionality |
| **Major improvement** | ✅ Required | Performance, UX, or capability enhancements |
| **Bug fix** | ❌ No | Unless it enables previously broken workflows |
| **Documentation** | ❌ No | Unless it's a new docs feature itself |
| **Internal refactor** | ❌ No | No user impact |
| **Dependency update** | ❌ No | Unless it enables new capabilities |

---

## Integration Process

### Step 1: Add Feature to Component

Edit `website/src/components/NewInVersion.tsx` and add your feature:

```typescript
{
  version: "1.4.0",
  date: "March 2026",
  features: [
    {
      id: "query-history",           // Unique identifier
      icon: "💾",                    // Emoji or icon
      title: "Query History & Persistence",
      description: "Every query you run is now automatically saved. Review past questions, compare results over time, and re-run with a click.",
      highlights: [
        "Automatic persistence of all completed queries",
        "Browse and search historical runs per workspace", 
        "Re-run any query against current documents",
        "Compressed storage (~80% space savings)"
      ],
      learnMore: "/features/query-history",  // Link to detail page (optional)
      docsLink: "/docs/query-history"         // Link to docs
    }
  ]
}
```

### Step 2: Create Feature Page (Optional but Recommended)

For major features, create a dedicated page at `website/src/app/features/[feature-id]/page.tsx`:

```typescript
// website/src/app/features/query-history/page.tsx
export default function QueryHistoryPage() {
  return (
    <FeaturePage
      title="Query History & Persistence"
      description="Never lose your document analysis work again."
      features={[...]}
      screenshots={[...]}
      codeExamples={[...]}
    />
  );
}
```

### Step 3: Update Homepage

Ensure `NewInVersion` component is imported and displayed in `website/src/app/page.tsx`:

```typescript
import NewInVersion from "@/components/NewInVersion";

// In the component:
<main>
  <Hero />
  <NewInVersion />    {/* Should be prominent, after Hero */}
  <HowItWorks />
  {/* ... */}
</main>
```

### Step 4: Add to Navigation (If Applicable)

If the feature has a dedicated page, add it to the Nav:

```typescript
// website/src/components/Nav.tsx
const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "New in v1.4", href: "/#new-in-version" },  // Link to section
  { label: "Docs", href: "/docs" },
];
```

---

## Component Structure

### NewInVersion Component

**Location:** `website/src/components/NewInVersion.tsx`

**Responsibilities:**
- Display version badge and release date
- List all features for that version
- Support collapsible previous versions
- Link to feature detail pages and docs

**Design Requirements:**
- Must be visually distinct (different background, accent color, or border)
- Must include version badge (e.g., "v1.4.0")
- Must be above the fold on desktop
- Must be responsive (stack on mobile)

### Feature Detail Page Template

**Location:** `website/src/app/features/[feature-id]/page.tsx`

**Sections:**
1. Hero with feature name and tagline
2. Problem/Solution statement
3. Feature highlights (3-4 cards)
4. Screenshot/demo
5. Code example
6. Use cases
7. CTA to try it

---

## Version Numbering

Use the version number that will be tagged in the release:

| Version Type | Example | When |
|--------------|---------|------|
| Major | v2.0.0 | Breaking changes |
| Minor | v1.4.0 | New features |
| Patch | v1.4.1 | Bug fixes only |

**Note:** If a feature is merged to `main` but not yet tagged, use the upcoming version number with a "(Coming Soon)" badge.

---

## Content Guidelines

### Title
- Max 5 words
- Action-oriented or benefit-focused
- Examples: "Query History", "Batch Processing", "Smart Chunking"

### Description
- Max 2 sentences
- Focus on user benefit, not technical details
- Answer: "What can I now do that I couldn't before?"

### Highlights
- 3-4 bullet points
- Mix of features and benefits
- Include metrics when possible ("80% faster", "50% less storage")

### Icons
- Use emoji for simplicity: 💾 📊 🔄 ⚡
- Or use Lucide icons: `<Database />`, `<History />`, `<Zap />`

---

## Checklist

Before submitting a PR with a new feature:

- [ ] Feature added to `NewInVersion.tsx`
- [ ] Version number matches upcoming release
- [ ] Date is accurate
- [ ] Icon chosen
- [ ] Description written
- [ ] 3-4 highlights listed
- [ ] Links added (learn more, docs)
- [ ] Component displays correctly on homepage
- [ ] Mobile responsive verified
- [ ] (Optional) Feature detail page created
- [ ] (Optional) Screenshots added

---

## Example: Complete Integration

### PR: Add Query History Feature

**Changes:**
1. `backend/src/services/run_repository.py` - New file
2. `backend/src/routers/history.py` - New file
3. `website/src/components/NewInVersion.tsx` - **Updated with new feature**
4. `website/src/app/features/query-history/page.tsx` - **New file**
5. `API_GUIDE.md` - Updated with endpoints

**NewInVersion.tsx addition:**
```typescript
{
  version: "1.4.0",
  date: "March 2026",
  features: [
    {
      id: "query-history",
      icon: "💾",
      title: "Query History & Persistence",
      description: "Every query you run is now automatically saved to disk. Review past questions, compare results over time, and re-run with a single click.",
      highlights: [
        "Automatic persistence with gzip compression (~80% savings)",
        "Browse complete query history per workspace",
        "Re-run any historical query against current documents",
        "Full detail view with citations and token usage"
      ],
      learnMore: "/features/query-history",
      docsLink: "/docs/query-history"
    }
  ]
}
```

---

## Maintenance

### Archiving Old Versions

When a version is no longer "new" (after 2-3 subsequent releases):
1. Move it to a collapsed "Previous Versions" section
2. Keep it accessible but not prominent
3. Link to a changelog page with all versions

### Changelog Page

Maintain a full changelog at `website/src/app/changelog/page.tsx` that includes all versions for reference.

---

## Questions?

If you're unsure whether your change needs website integration:
1. Ask: "Will users be excited about this?"
2. If yes → Add to NewInVersion
3. If no → Just update docs/CHANGELOG.md

When in doubt, add it. It's better to highlight a feature than hide it.
