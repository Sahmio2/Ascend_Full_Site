# ASCEND Coach Studio — Modern SaaS Prototype v1

**Status:** Design prototype for review. Do not use for actual coaching decisions or sensitive client records.

## Open the prototype

Open `ASCEND_Coach_Studio_Modern_SaaS_v1.html` in Chrome, Safari or a modern desktop/mobile browser. It is fully self-contained, with no external fonts, APIs or account requirements.

## What to test

1. **Overview** — compact task queue, filters, upcoming deadlines and capacity snapshot. Click a row to open the relevant workflow.
2. **Clients** — search and filter the fictional client roster; click a client to open the details drawer.
3. **Assessments** — choose a client, view intake facts and safety state, record a mock interpretation and note document requests. The safety hold prevents programme activation.
4. **Programmes** — inspect training and nutrition drafts, edit and save sample fields, preview what a client would see, and test the explicit publish confirmation. Published examples are read-only until a new draft version is created.
5. **Check-ins** — view review-period evidence, choose an evidence-led decision, write a rationale and simulate recording a personal review.
6. **Inbox** — review high-priority versus routine messages and capture a sample response (nothing is sent).
7. **Operations** — review capacity and service safeguards.
8. **Theme & mobile** — change appearance using sidebar control; tap the hamburger menu on small screens. Cmd/Ctrl+K opens search. Esc closes drawers and dialogs.

## Business and safety rules reflected

- 10 active-client limit; max 3 new onboardings per week.
- Personal programme delivery within 5 business days of a completed assessment.
- Two personal check-ins and two high-priority messages per billing month.
- Coach approval required for every programme published; Draft / Active / Superseded versioning.
- Health/safety holds cannot be treated as medical clearance; nothing gets activated automatically.
- Routine missed workouts create no penalties or immediate extra tasks.
- Nutrition prescriptions use grams with food preparation states.
- No client-facing programme downloads or automatic plan edits.

## Prototype limitations

All people, values, deadlines, safety indications, entries and statuses are fictional. The prototype is an in-memory demo with no backend, authenticated users, live inbox, real food database, payment service, PAR-Q+ integration, stored records or medical process. The theme choice alone is saved in browser storage if available.

**No Notion records were updated by generating this prototype.**
