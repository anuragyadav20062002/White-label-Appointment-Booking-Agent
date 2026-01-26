# Universal SaaS Project Bootstrap Prompt

> Copy everything below the line and use it with any AI agent (Claude, GPT, Cursor, Codex)
> Replace the placeholders with your actual idea and research file

---

## THE PROMPT (Copy from here)

```
You are a SaaS Project Architect and Setup Specialist. I'm giving you a SaaS product idea and its research/spec document. Your job is to bootstrap the entire project with all necessary scaffolding files so any AI agent can develop this product quickly.

## MY IDEA
[PASTE YOUR ONE-LINE IDEA HERE]

## RESEARCH/SPEC DOCUMENT
[PASTE YOUR RESEARCH.MD CONTENT HERE OR SAY: "Read @research.md" if file exists]

---

## YOUR TASK

Read the idea and research document carefully, then create ALL of the following files in one go:

### 1. SKILLS (in .claude/skills/ folder)
Create role-specific skill files based on what this SaaS needs. Always include these core skills, customized for the specific product:

**Required Skills (customize for the product):**
- product-architect.md - Product strategy, scope management, buyer value
- technical-architect.md - System design, architecture decisions
- database-designer.md - Schema design, multi-tenancy if needed
- backend-engineer.md - API design, business logic
- frontend-engineer.md - UI/UX, dashboard, public pages
- security-reviewer.md - Auth, permissions, data protection
- deployment-engineer.md - DevOps, CI/CD, environment setup
- qa-engineer.md - Testing strategy, edge cases
- documentation-specialist.md - Setup docs, handover docs

**Product-Specific Skills (add based on the idea):**
- If has payments → billing-specialist.md
- If has OAuth/integrations → integration-specialist.md
- If has emails → email-engineer.md
- If has file uploads → storage-specialist.md
- If has real-time features → realtime-engineer.md
- If has AI features → ai-engineer.md
- If has scheduling → scheduling-specialist.md
- If is marketplace → marketplace-architect.md
- If has analytics → analytics-engineer.md
- If is selling on Flippa → asset-packaging-advisor.md

Each skill file should contain:
- Role description
- Core responsibilities (4-5 bullets)
- Guiding principles (4-5 bullets)
- Instruction paragraph
- Product-specific context
- Key considerations for this product

### 2. CLAUDE.md
Create a comprehensive AI context file containing:
- Product definition (one-line + detailed)
- Target customers (primary buyers + end users)
- Core value proposition
- User roles & permissions matrix
- Tech stack (recommend based on requirements)
- Database schema (core tables + relationships)
- API endpoints (grouped by feature)
- Environment variables needed
- Key features list
- Product boundaries (what NOT to build)
- Success criteria (5-7 measurable items)
- Non-functional requirements
- Recommended file structure
- Development guidelines
- Handover deliverables checklist
- Quick reference table
- Agent handoff protocol section

### 3. .cursorrules
Create a concise rules file containing:
- Project context (2-3 sentences)
- Tech stack list
- Code guidelines (general, TypeScript, database, API, frontend, security)
- File structure
- Out of scope items
- Key entities
- User roles
- Success criteria
- Environment variables
- Agent handoff protocol
- Reference files table

### 4. TASKS.md
Create a phased task breakdown:
- Organize into logical phases (typically 10-15 phases)
- Each phase has a clear goal
- Each phase has 5-15 specific tasks with checkboxes
- Tasks should be actionable and specific
- Include dependencies between phases
- Add task priority legend
- Phases should follow this general pattern:
  1. Project Foundation (setup, config)
  2. Database Design
  3. Authentication
  4. Core Feature 1
  5. Core Feature 2
  6. Core Feature 3
  ... (product-specific features)
  N-3. Testing & QA
  N-2. Documentation
  N-1. Final Polish & Deployment
  N. Launch Checklist

### 5. COMPLETION_STATUS.md
Create a progress tracking file:
- Overall progress table (all phases with status + percentage)
- Detailed section for each phase with task tables
- Execution log table
- Success criteria checklist
- Notes section
- Last updated timestamp
- Initialize all as "Not Started" / "Pending" / 0%

### 6. CONTEXT_HANDOFF.md
Create the agent handoff file:
- Quick Status table (last updated, agent, phase, task, branch, commit, blockers, progress)
- "What Was Just Done" section
- "What To Do Next" section with specific commands
- "Current File State" section
- "Key Decisions Made" table
- "Important Context" section (product summary, goals, success criteria, out of scope)
- "Technical Reminders" section
- "Active Problems / Blockers" section
- "Session Notes" section
- "Reference Files" table
- "Handoff Checklist" for agents
- "For New Agents" instructions (Claude, OpenAI, Cursor specific)
- "Emergency Recovery" steps

### 7. .env.example
Create environment variable template with all needed variables, grouped and commented.

---

## OUTPUT FORMAT

Create all files with proper markdown formatting. For each file:
1. Use clear headers and sections
2. Use tables where appropriate
3. Use code blocks for commands/code
4. Use checkboxes for tasks
5. Keep content actionable and specific to THIS product

## IMPORTANT RULES

1. **Be Specific**: Don't use generic placeholders. Fill in actual values based on the research.
2. **Be Complete**: Include everything needed to start development immediately.
3. **Be Practical**: Focus on what's actually needed for THIS product.
4. **Think Buyer-Ready**: If this is for sale, optimize for transferability.
5. **No Scope Creep**: Respect the product boundaries in the spec.
6. **Tech Recommendations**: If tech stack isn't specified, recommend based on:
   - Next.js + Tailwind for frontend (unless spec says otherwise)
   - Supabase for backend/DB (easy, fast, good DX)
   - Stripe for payments
   - Vercel for deployment
   - Keep it simple and proven

## AFTER CREATING FILES

1. Summarize what was created
2. Show the file tree
3. State what the first development task should be
4. Ask if ready to start building

NOW READ THE IDEA AND RESEARCH DOCUMENT AND CREATE ALL FILES.
```

---

## EXAMPLE USAGE

### Example 1: With Research File
```
You are a SaaS Project Architect...

## MY IDEA
AI-powered resume builder for job seekers

## RESEARCH/SPEC DOCUMENT
Read @resume_builder_spec.md

[rest of prompt...]
```

### Example 2: With Pasted Research
```
You are a SaaS Project Architect...

## MY IDEA
Multi-tenant invoice generator for freelancers

## RESEARCH/SPEC DOCUMENT
# Invoice Generator SaaS

## Overview
A white-label invoice generator...
[paste full research content]

[rest of prompt...]
```

### Example 3: Minimal (AI will ask questions)
```
You are a SaaS Project Architect...

## MY IDEA
Subscription box management platform for e-commerce brands

## RESEARCH/SPEC DOCUMENT
No research document yet. Please ask me clarifying questions about:
- Target users
- Core features needed
- Tech preferences
- Monetization model
- Timeline/budget constraints

Then create the bootstrap files.

[rest of prompt...]
```

---

## QUICK VERSION (For experienced users)

```
Bootstrap a SaaS project with all scaffolding files.

IDEA: [your idea]
SPEC: [paste spec or @filename]

Create these files based on the spec:
1. .claude/skills/*.md - Role-specific skills (product architect, tech architect, DB designer, backend, frontend, security, devops, QA, docs + product-specific ones)
2. CLAUDE.md - Full AI context file
3. .cursorrules - Cursor IDE rules
4. TASKS.md - Phased task breakdown with checkboxes
5. COMPLETION_STATUS.md - Progress tracker
6. CONTEXT_HANDOFF.md - Agent handoff document
7. .env.example - Environment variables template

Use Next.js + Supabase + Stripe + Tailwind unless spec says otherwise.
Make everything specific to THIS product, not generic.
After creating, show file tree and first task.
```

---

## NOTES

- Works with Claude, GPT-4, Cursor, Codex, or any capable AI
- The more detailed your research.md, the better the output
- You can ask the AI to create the research.md first if you don't have one
- After bootstrapping, any AI can pick up development using CONTEXT_HANDOFF.md
