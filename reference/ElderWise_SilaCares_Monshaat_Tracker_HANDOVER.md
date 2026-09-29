# ElderWise / SilaCares --- Monshaat Action Tracker & Live Dashboard

## Project Handover Brief for a New Chat

### 1. Objective

Build a production-ready, private, web-based execution tracker for the
ElderWise / SilaCares startup's Monshaat recommendations.

The original tracker started as a standalone HTML dashboard. The next
version should become a live application with:

-   persistent database-backed task/status data
-   consultant/guider attribution
-   session/source tracking
-   detailed notes explaining what was done, not done, blocked, or why
-   follow-up questions for Monshaat consultants
-   evidence/document uploads
-   evidence metadata
-   ability to review/verify whether uploaded evidence actually
    satisfies a recommendation
-   dashboard/KPIs and filters
-   secure authentication
-   private evidence storage
-   future ability to export a follow-up report for Monshaat

The user wants an implementation-oriented architecture, not just a
static mockup.

------------------------------------------------------------------------

## 2. Existing HTML Prototype

The current prototype is:

`Monshaat_Action_Tracker_ElderWise_SilaCares.html`

It is approximately 32 KB / 289 lines and contains the current task
structure, consultant attribution, notes, evidence metadata UI,
search/filtering, progress dashboard, and localStorage persistence.

Important limitation of the prototype: - It is offline/local. - Notes
and task state are stored in browser localStorage. - The evidence picker
records file metadata, but does NOT upload/store the actual evidence
file remotely. - Therefore it is a prototype/reference UI, not the final
production architecture.

Use the HTML as the visual and functional baseline, but do not preserve
its localStorage architecture in the production version.

Download/reference:
`[Monshaat_Action_Tracker_ElderWise_SilaCares.html](sandbox:/mnt/data/Monshaat_Action_Tracker_ElderWise_SilaCares.html)`

------------------------------------------------------------------------

# 3. Confirmed Target Architecture

Recommended architecture:

GitHub → source code / version control

Next.js web application → application UI and server-side routes

Vercel → production hosting/deployment

Supabase ICS project → PostgreSQL database → Supabase Auth → Supabase
Storage → Row Level Security → optional Edge Functions later

The user already has Vercel connected and has a Supabase
organization/project specifically for this purpose.

Do NOT create another Supabase project unless explicitly instructed.

Supabase's official ChatGPT app can inspect and manage projects, execute
SQL, modify schemas, manage migrations, inspect security advisors, and
work with Edge Functions. The official integration supports pairing a
ChatGPT conversation/project with a specific Supabase project. Verify
the target project before making changes.

------------------------------------------------------------------------

# 4. Supabase Target

Target organization:

`ICS`

Plan:

`Free`

Target project:

`ICS`

Region shown in the user's Supabase dashboard:

`ap-south-1`

Current visible usage at the time of handover:

-   Database: 98 MB / 500 MB
-   File storage: 0 / 1 GB
-   Egress: 0.02 / 5 GB
-   Monthly active users: 0 / 50,000
-   Log ingestion: 0.04 / 1 GB

The user explicitly does NOT want to create another paid Supabase
server/project for this application.

The ICS project should be treated as the intended backend for this
tracker.

IMPORTANT: Before modifying the ICS project: 1. Inspect existing tables.
2. Inspect migrations. 3. Inspect current database usage/schema. 4.
Check whether the project is already used by another application. 5.
Check Storage. 6. Check Auth. 7. Check security/RLS advisors. 8. Do not
overwrite or drop existing structures. 9. Prefer additive migrations
with clear names.

------------------------------------------------------------------------

# 5. Existing Supabase Connection Situation

The user's ChatGPT settings show two Supabase connections:

1.  `Talal's Supabase account`
2.  `Talal's Supabase account — Supabase ICS`

The second connection is the connection associated with the ICS
organization.

In the previous chat, the generic Supabase tool initially exposed only
the first organization. A later attempt returned:

`link_id must identify an eligible linked account`

This indicates that multiple linked accounts exist but the currently
exposed tool session did not allow explicit selection of the second
account.

The user has now stated that another ChatGPT conversation DOES have
access to the ICS organization.

Therefore this new chat is expected to use the ICS-connected Supabase
account and should verify that before proceeding.

------------------------------------------------------------------------

# 6. First Task in the New Chat

Do NOT immediately create tables.

First verify access to the ICS organization/project.

Expected result:

Organization: `ICS`

Project: `ICS`

Then inspect read-only:

-   project metadata
-   project ID/reference
-   tables in `public`
-   existing migrations
-   extensions
-   Edge Functions
-   Storage configuration if available
-   security advisors
-   current Auth configuration if available

Report what already exists before making any changes.

------------------------------------------------------------------------

# 7. Monshaat Source / Consultant Context

The tracker consolidates multiple Monshaat consultations held during
August--September 2026.

Known consultant/guider attribution:

### Huda Ahmed Muhammed Flatah

Innovation-related sessions: - 10 Aug 2026 - 24 Sep 2026

### Abdulhamid Abu Bakr

IT session: - 24 Sep 2026

### Abeer Mahmoud Al-Tamimi

Education, Training & Consulting sessions: - 27 Sep 2026 - approximately
4:00 PM - approximately 4:20 PM - approximately 4:40 PM

The exact English spelling of consultant names should be verified
against official Monshaat records if it matters in formal reports.

------------------------------------------------------------------------

# 8. Core Monshaat Recommendations Captured

The original recommendations included:

## Product / Customer Focus

-   Narrow the initial target segment.
-   Focus initially on elderly people who are capable of using WhatsApp.
-   Build a stronger MVP around AI + WhatsApp.
-   Include medication reminders.
-   Provide simple follow-up.
-   Avoid taking medical responsibility.
-   Keep UX extremely simple.
-   Use automated alerts/reports.

## Market Validation

-   Validate the dual-user/dual-buyer model:
    -   adult children/family members are likely buyers/payers
    -   elderly people are the primary users/beneficiaries
-   Conduct a closed pilot of approximately 50 users.
-   Work with elderly-care associations/care centers such as Waqaar
    where appropriate.
-   Test early monthly subscription/payment behavior.
-   Collect structured user feedback.
-   Document evidence of demand rather than relying only on interviews.

## GTM

-   Develop partnerships with associations and elderly-care specialists.
-   Build trust around the service.
-   Explore diaspora/community channels.
-   Build a repeatable acquisition model.

## Legal / Company Formation

Recommendations included exploring: - Saudi company formation for
foreigners - MISA entrepreneurship route - Saudi Business Center - LLC
structure - appropriate licensing

These are consultant recommendations and must NOT be treated as
confirmed legal advice. Verify current requirements with official Saudi
authorities and qualified professionals.

## IP

-   Protect the product/code/IP after the product is sufficiently
    complete.
-   Maintain ownership and authorship records.
-   Document source code and product assets.

## Social Impact

-   Register/use Impact Hub for social-impact positioning where
    relevant.

## Entrepreneurship / Education

-   Study MIT entrepreneurship methodology.
-   Explore Misk Launchpad.
-   Contact Abeer regarding Misk Launchpad and obtaining the relevant
    letter/support.

## Funding / Support

Potential programs mentioned: - InspireU - Jada 30 - social-impact /
healthcare / nonprofit incubators - Oqal angel network - government
support and entrepreneurship programs

These are leads, not guarantees of eligibility.

## Pitch / Investor Readiness

Build a pitch deck covering: - problem - solution - target customer -
market - GTM - business model - scope - value / impact - traction -
validation - competitive context - roadmap

## Incubators / Accelerators

Explore formal incubation/acceleration and company formalization.

## Follow-up Sessions

Potential follow-up areas: - Operations & Execution - Legal -
Innovation - Accelerators / Incubators / Coworking - IT

------------------------------------------------------------------------

# 9. Immediate Opportunities Mentioned by Monshaat

The original tracker captured these as leads and dates from consultant
discussions:

-   E3 Venture
-   AI challenge for Islamic content --- 29 Sep 2026 --- SAR 200k
-   KAPSARC Arabic prize --- 30 Sep 2026
-   Future Minerals Pioneers --- 30 Sep 2026
-   Future Hajj Innovations bootcamp --- 30 Sep 2026
-   Tuwaiq Coding Challenge --- 30 Sep 2026
-   Digital Health Innovation Hackathon, KSU --- 1 Oct 2026 --- SAR 1M
-   Garage Challenge --- 1 Oct 2026
-   Tuwaiq technical project-building --- 1 Oct 2026
-   Saudi Engineers Engineering Hackathon --- 5 Oct 2026
-   Future Gamers --- 10 Oct 2026
-   Noura Al-Malahi Award --- 15 Oct 2026 --- SAR 400k

IMPORTANT: These dates and eligibility details came from Monshaat
consultant discussions and must be verified against the current official
program pages before being treated as actionable deadlines.

Do not invent or assume eligibility.

------------------------------------------------------------------------

# 10. Current Tracker Structure

The HTML prototype groups the work into nine phases:

### Phase 1 --- Foundation & Strategic Focus

Clarify positioning, target segment, value proposition, initial
customer/user model, and strategic focus.

### Phase 2 --- Product & MVP

Define MVP scope, WhatsApp workflow, AI components, medication
reminders, follow-up/reporting, UX, safety boundaries, and MVP
validation.

### Phase 3 --- Market Validation & GTM

Pilot users, interviews, associations/care centers, partnerships,
acquisition channels, pricing/subscription validation, trust-building,
and evidence collection.

### Phase 4 --- Legal, Regulatory & Company Formation

Company structure, Saudi incorporation routes, MISA/SBC investigation,
licensing, terms/privacy, data protection, healthcare boundaries, and
regulatory questions.

### Phase 5 --- IP & Corporate Assets

Code ownership, IP protection, trademarks/brand assets, domain,
repositories, documentation, and evidence of authorship.

### Phase 6 --- Pitch Deck & Investor Readiness

Problem, solution, market, GTM, business model, traction, impact,
roadmap, financial assumptions, pitch deck, and supporting evidence.

### Phase 7 --- Incubators, Accelerators & Support Programs

Misk, InspireU, incubators, accelerators, social impact programs,
healthcare programs, Oqal, Jada-related opportunities, and other
verified programs.

### Phase 8 --- Competitions & Immediate Opportunities

Short-term competitions, hackathons, bootcamps, awards, and application
deadlines.

### Phase 9 --- Operating Cadence & Follow-up

Monshaat follow-up sessions, action reviews, blocked items, consultant
questions, evidence gaps, and recurring progress review.

------------------------------------------------------------------------

# 11. Required Data Model

The production database should be designed around the actual workflow
rather than simply reproducing the HTML.

Suggested entities:

## consultants

-   id
-   name
-   organization
-   role/area
-   notes
-   created_at
-   updated_at

## consultation_sessions

-   id
-   consultant_id
-   session_date
-   session_time
-   topic
-   raw_notes
-   source_reference
-   created_at
-   updated_at

## recommendations

-   id
-   session_id
-   title
-   description
-   original_recommendation
-   source
-   priority
-   category
-   created_at
-   updated_at

## tasks

-   id
-   recommendation_id
-   title
-   description
-   phase
-   priority
-   status
-   owner
-   due_date
-   blocked_reason
-   completion_date
-   created_at
-   updated_at

Suggested status values:

-   Not Started
-   In Progress
-   Blocked
-   Completed
-   Needs Follow-up

## task_notes

-   id
-   task_id
-   note
-   note_type
-   created_by
-   created_at
-   updated_at

Useful note types:

-   Progress
-   Reason Not Done
-   Blocker
-   Decision
-   Consultant Feedback
-   Follow-up Question

## follow_up_questions

-   id
-   task_id
-   consultant_id
-   question
-   answer
-   answered_at
-   status

## evidence

-   id
-   task_id
-   storage_path
-   original_filename
-   mime_type
-   file_size
-   uploaded_by
-   uploaded_at
-   description
-   evidence_type

## evidence_reviews

-   id
-   evidence_id
-   task_id
-   verification_status
-   findings
-   missing_items
-   reviewer
-   reviewed_at

Suggested verification states:

-   Not Reviewed
-   Verified
-   Partially Verified
-   Not Verified
-   Needs Review

## audit_log

-   id
-   user_id
-   action
-   entity_type
-   entity_id
-   metadata
-   created_at

This is useful because the tracker is intended to become a serious
execution and accountability system.

------------------------------------------------------------------------

# 12. Evidence Upload Design

Actual evidence files MUST NOT be stored in GitHub.

Use:

Supabase Storage → private bucket

Database stores only metadata and the storage path.

Evidence could include:

-   Monshaat emails
-   consultation notes
-   screenshots
-   pitch decks
-   PDFs
-   company-registration documents
-   accelerator applications
-   acceptance/rejection emails
-   product screenshots
-   pilot evidence
-   user research
-   contracts
-   certificates
-   IP documentation

The UI should support:

-   upload
-   list
-   preview/download through authenticated access
-   delete
-   description
-   evidence type
-   verification status
-   AI/manual review

Do not make evidence publicly accessible.

------------------------------------------------------------------------

# 13. Authentication & Security

The application should be private.

Recommended:

-   Supabase Auth
-   authenticated users only
-   private Storage bucket
-   Row Level Security
-   database policies tied to authenticated users
-   no service-role key in browser
-   secrets only in Vercel environment variables
-   no sensitive evidence committed to GitHub

Initially the application can be single-owner/private, but the schema
should not make future multi-user access impossible.

Potential future roles:

-   Owner
-   Admin
-   Consultant/Reviewer
-   Read-only

------------------------------------------------------------------------

# 14. Dashboard Requirements

The live dashboard should retain the useful parts of the HTML prototype
and improve them.

Top-level KPI cards:

-   Total Tasks
-   Completed
-   In Progress
-   Blocked
-   Needs Follow-up
-   Not Started
-   Evidence Items
-   Verification Pending

Progress:

-   overall completion percentage
-   phase-level completion
-   priority breakdown
-   consultant/session breakdown

Filters:

-   Phase
-   Status
-   Priority
-   Consultant
-   Verification status
-   Evidence present/missing
-   Search text

Task view should show:

1.  Task title
2.  Phase
3.  Recommendation
4.  Consultant
5.  Source session
6.  Priority
7.  Status
8.  Notes
9.  Blocker/reason
10. Follow-up question
11. Evidence
12. Verification
13. Last updated

------------------------------------------------------------------------

# 15. AI Verification Concept

AI verification is a later but important feature.

Workflow:

1.  User uploads evidence.
2.  System stores it securely.
3.  User selects "Review Evidence".
4.  AI receives:
    -   task requirement
    -   original Monshaat recommendation
    -   task description
    -   evidence text/content
5.  AI produces:
    -   verification status
    -   what the evidence proves
    -   what it does not prove
    -   missing evidence
    -   suggested next action
    -   suggested Monshaat follow-up question

Important: AI verification should NOT automatically mark a task as
completed without user confirmation.

Suggested UI:

`AI Review` → `Verified` → `Partially Verified` → `Not Verified` →
`Needs Review`

with an explanation.

For sensitive/legal/regulatory documents, present AI output as an
evidence review aid, not legal advice.

------------------------------------------------------------------------

# 16. Recommended Implementation Phases

## Phase A --- Discovery / Safety

-   Verify ICS Supabase connection.
-   Inspect current ICS project.
-   Confirm project ID.
-   Inspect tables/migrations.
-   Confirm no destructive overlap.
-   Review security advisors.

## Phase B --- Database Foundation

Create additive migrations for: - consultants - sessions -
recommendations - tasks - notes - follow-up questions - evidence -
evidence reviews - audit log

Add: - enums/check constraints where appropriate - indexes - foreign
keys - timestamps - RLS policies

## Phase C --- Storage

Create private evidence bucket.

Implement authenticated upload/download/delete.

Do NOT expose the bucket publicly.

## Phase D --- Next.js Application

Build: - authentication - dashboard - task list - task detail - notes -
consultants - sessions - evidence upload - evidence list -
filters/search - progress/KPIs

## Phase E --- Migration of Prototype Data

Convert the current HTML's task data into database seed/migration data.

Preserve: - task titles - phases - priorities - consultant attribution -
source/rationale - recommendation relationships

Do not blindly import localStorage because it is browser-local and may
not contain all useful state.

## Phase F --- Vercel Deployment

-   Create/choose GitHub repository.
-   Connect repository to Vercel.
-   Configure environment variables.
-   Deploy preview.
-   Test.
-   Deploy production.

Git pushes should trigger deployments through Vercel's Git integration.

## Phase G --- Verification / Hardening

Test: - authentication - RLS - evidence privacy - uploads - downloads -
task updates - filters - dashboard calculations - mobile
responsiveness - error states - audit trail

## Phase H --- AI Evidence Review

Only after the core tracker is stable.

------------------------------------------------------------------------

# 17. GitHub / Vercel

Recommended repository:

`elderwise-monshaat-tracker`

Possible alternative:

`sillacares-monshaat-tracker`

Prefer a private repository.

Recommended stack:

-   Next.js
-   TypeScript
-   Tailwind CSS
-   Supabase JS
-   Supabase SSR/auth utilities
-   a component system such as shadcn/ui if useful
-   Zod for validation where appropriate

Vercel is a natural deployment target for Next.js and supports Git-based
deployments. Verify the user's existing Vercel account/project before
creating a new project.

Do not hardcode: - Supabase service-role keys - OpenAI keys - other
secrets

------------------------------------------------------------------------

# 18. Current Vercel Situation

The user previously said Vercel is already connected.

The Vercel connector exposed no teams in the previous conversation, so
this may be a personal Vercel account rather than a team account.

Do not assume a Vercel team/project exists.

Before deployment: - inspect existing Vercel projects if available -
determine whether to create a new personal project - connect the GitHub
repository - configure environment variables

------------------------------------------------------------------------

# 19. User's Development Workflow Preference

The user is comfortable with:

-   GitHub
-   Vercel
-   Supabase
-   PostgreSQL
-   n8n
-   Cursor
-   AI-assisted development

The user may use Cursor as the implementation agent.

A good workflow is:

ChatGPT = architect / planner / reviewer

Cursor = code implementation

GitHub = source of truth

Vercel = deployment

Supabase = backend

Do not over-engineer the initial release.

------------------------------------------------------------------------

# 20. Definition of Done --- MVP

The first production version is complete when:

-   User can log in.
-   Dashboard loads from Supabase.
-   All Monshaat tasks exist in database.
-   Tasks can be filtered/searched.
-   User can change status.
-   User can add notes.
-   User can record why something is not completed.
-   Consultant is visible on relevant tasks.
-   User can add follow-up questions.
-   User can upload evidence.
-   Evidence is stored privately in Supabase Storage.
-   Evidence metadata is stored in database.
-   User can retrieve evidence securely.
-   Dashboard calculates real progress.
-   RLS prevents unauthorized access.
-   App is deployed to Vercel.
-   Source code is in GitHub.
-   No sensitive files/secrets are committed to GitHub.
-   Existing ICS database objects are not broken or overwritten.

------------------------------------------------------------------------

# 21. Important Constraints

1.  Do not create another Supabase project.
2.  Do not upgrade Supabase to paid just for this tracker.
3.  Do not overwrite existing ICS database structures.
4.  Do not make evidence storage public.
5.  Do not put evidence files in GitHub.
6.  Do not hardcode secrets.
7.  Do not treat Monshaat recommendations as legal/regulatory facts
    without verification.
8.  Verify current accelerator/hackathon deadlines before relying on
    them.
9.  Preserve the HTML prototype as a reference.
10. Prefer additive migrations and reversible changes.
11. Inspect before modifying.
12. Do not mark a task completed solely because AI thinks evidence is
    sufficient; require user confirmation.
13. Keep the first version simple enough to actually use.

------------------------------------------------------------------------

# 22. Immediate Instruction to the New Chat

Start by saying that you have received the project handover.

Then:

### Step 1

Verify that you can access:

`ICS → ICS`

through the connected Supabase account.

### Step 2

Read-only inspect: - project metadata - tables - migrations -
extensions - storage - Edge Functions - security advisors

### Step 3

Report the existing state.

### Step 4

Compare the existing project against the proposed schema.

### Step 5

Only after review, propose the exact SQL migration plan.

### Step 6

Wait for user approval before any destructive or potentially disruptive
change.

Do NOT immediately create a new project.

------------------------------------------------------------------------

# 23. Reference Architecture

``` text
                    ┌─────────────────────┐
                    │       User          │
                    │  ElderWise / Sila   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Next.js Web App   │
                    │   TypeScript / UI   │
                    └──────────┬──────────┘
                               │
                     Hosted by Vercel
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Supabase ICS     │
                    │                     │
                    │ PostgreSQL          │
                    │ Auth                │
                    │ Storage             │
                    │ RLS                 │
                    │ Edge Functions      │
                    └─────────────────────┘
                               ▲
                               │
                    ┌─────────────────────┐
                    │       GitHub        │
                    │ Source / Migrations │
                    └─────────────────────┘
```

Future:

``` text
Evidence
   │
   ▼
Supabase Storage
   │
   ▼
AI Evidence Review
   │
   ├── Verified
   ├── Partially Verified
   ├── Not Verified
   └── Needs Review
```

------------------------------------------------------------------------

# 24. Current Prototype Must Be Preserved

The HTML prototype is not obsolete.

Use it as the baseline for: - task taxonomy - phase structure - visual
layout - interaction concepts - notes - consultant attribution -
evidence UI - filtering - dashboard KPIs

But replace: - localStorage - local evidence metadata-only behavior

with: - Supabase database - Supabase Auth - Supabase Storage - RLS -
real-time/database-backed state

------------------------------------------------------------------------

# 25. Final Goal

The final product should become a living Monshaat execution workbench
rather than a checklist.

The intended workflow is:

Monshaat recommendation → actionable task → assigned consultant/source →
status → progress notes → blocker/reason → follow-up question → evidence
→ evidence verification → completion → documented proof for next
Monshaat session

The system should make it easy for the user to answer, at any time:

-   What did Monshaat ask us to do?
-   Who advised us?
-   What have we completed?
-   What is blocked?
-   Why is it blocked?
-   What evidence do we have?
-   Does the evidence actually satisfy the recommendation?
-   What do we need to ask Monshaat next?
-   What percentage of the overall plan is complete?
-   What should we work on next?

This is the core product requirement.