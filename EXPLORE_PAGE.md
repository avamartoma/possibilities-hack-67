# Explore Page (Career Discovery) — Person A's slice

The home of the feature: a LinkedIn-styled, gamifiable way to discover roles you'd
never have searched for. You drill down from a broad interest into a real job title,
and **what you see is filtered to what's actually open to you** based on your profile.

## The drill-down

```
Interest bubble        →   Field (industry)   →   Job title (leaf)   →   Comparison page
(abstracted groups)        (from the data)        (from the data)        (Person B)
💻 Technical & Building     Technology             Software Engineer      <ComparisonPanel/>
🎨 Creative & Media         Engineering            DevOps Engineer
🔬 Science & Discovery      Manufacturing          Data Scientist …
🚀 Aerospace & Robotics
💼 Business & Money
❤️ People & Care
⚖️ Law, Cities & Hospitality
```

The bubbles, fields, and titles are all derived from `sample_data/jobs_data.json`
(207 distinct positions across 21 industries). The 7 bubbles abstract the 21
industries into broad, GenZ-friendly groups.

## The eligibility filter (personalization)

A job title is **hidden** if the viewing user couldn't realistically apply:

1. **Seniority (grad-year rule).** Using the latest `graduation_year` in the
   user's `school_history`: if they graduated within the **last 4 years** (or are
   still a student with no grad year), they're **not shown Senior/Management**
   roles — only titles with an Entry/Mid path. Experienced users (graduated 5+
   years ago) see all levels.
2. **Degree.** Degree-required fields (Healthcare, Legal, Finance, Aerospace,
   Science, Biotech, Engineering, Education, Product Management, Architecture,
   Energy, Technology) are **hidden from users without a degree**. Degree-optional
   fields (much of Manufacturing, Hospitality, Retail, Customer Success, Design,
   Media, Sales) stay visible.

The same map therefore shows a different reachable world to each person.

## What's here

```
frontend/
  app/explore/page.tsx                 # the /explore route
  components/Explore/
    ExploreView.tsx                    # drill-down state + breadcrumb + handoff
    BubbleGrid.tsx                     # level 1 (interest bubbles, with counts)
    FieldList.tsx                      # level 2 (industries in a bubble)
    RoleList.tsx                       # level 3 (job titles, LinkedIn job cards)
    RoleDetail.tsx                     # graceful detail (non-canonical / demo user)
    UserPicker.tsx                     # "View as" + eligibility summary
    Breadcrumb.tsx
  lib/explore/
    types.ts                           # JobPosition / JobsCatalog / UserProfile / UserSignals
    taxonomy.ts                        # bubbles, requiresDegree, title→roleId
    eligibility.ts                     # deriveUserSignals + isEligible (the rules above)
    buildTree.ts                       # group catalog → bubble→field→title
    data.ts                            # bundled catalog + demo users
    ui.ts                              # LinkedIn design tokens
  data/jobsCatalog.json                # pre-aggregated from sample_data/jobs_data.json
  data/exploreUsers.json               # 3 demo profiles (user_data.json shape)
```

## Run it

```bash
cd frontend && npm install && npm run dev   # http://localhost:3000/explore
```
No backend required for Explore (catalog + demo users are bundled). The leaf
hand-off reuses Person B's `<ComparisonPanel>`, which has its own backend
fallback.

Verified: `npx tsc --noEmit` and `npm run build` both pass clean.

## Demo story (the three profiles)

Use the **"View as"** picker to show how the map adapts:

| Profile | Signal | Roles shown |
|---|---|---|
| **Bob Smith** (grad 2021, Finance) | experienced | **207 / 207** — all levels |
| **Charlie Brown** (grad 2023, IT) | recent grad | **188 / 207** — no Senior/Management |
| **Riley Chen** (student, no degree) | student | **54 / 207** — Entry + degree-optional only |

That contrast *is* the pitch: the same world, sized to where you actually are.

## Integration notes for the team

- **Person B (Comparison):** clicking a leaf opens `<ComparisonPanel userId roleId />`.
  `roleId` comes from `TITLE_TO_ROLE_ID` in `lib/explore/taxonomy.ts`. Only the **10
  canonical roles** in `roleSkills.json` are wired today; other titles show a
  graceful overview (`RoleDetail`). As `roleSkills.json` grows, extend that map and
  more leaves light up. Needs Person B's backend on `user_data.json` so real user
  ids resolve in `/api/fit` (synthetic `user_demo_*` profiles are marked
  not-fit-capable and skip the fit panel).
- **Person C (Milestone):** the hand-off chain is Explore → Comparison →
  "Build my path", unchanged.

## Data caveat

`jobsCatalog.json` is pre-aggregated from `sample_data/jobs_data.json`. If that file
changes, regenerate the catalog (distinct positions per industry with their levels,
companies, and salary range). Jobs still have **no skills field**, so role→skills
fit remains the hand-authored canonical map in `roleSkills.json` (Person B).
