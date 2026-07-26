# GET DIVINE — Digital Style Guide

**Version:** 1.0  
**Purpose:** Permanent UI, UX, content, and implementation contract for Antigravity  
**Applies to:** The Get Divine React 19 + Vite 6 + TypeScript application

---

## 1. How Antigravity Must Use This Guide

Before changing any page or component:

1. Read this file and inspect the existing implementation.
2. Reuse existing design tokens and components before creating new ones.
3. Preserve the current React, TypeScript, React Router, vanilla CSS, and self-hosted-font architecture.
4. Treat every rule marked **MUST**, **NEVER**, or **DO NOT** as an acceptance requirement.
5. If a request conflicts with this guide, preserve the brand system and explain the conflict before changing it.
6. Do not redesign unrelated areas while implementing a feature.

This file should live in the repository root and be referenced in every Antigravity request:

> Read `GET_DIVINE_STYLE_GUIDE.md` before editing. The implementation must comply with it. Reuse the existing design system and report any necessary exception.

---

## 2. Brand Foundation

### Brand

- **Primary name:** GET DIVINE
- **Endorsement:** With Sahmi El
- **Programme:** The Ascension Program
- **Method:** Tame the Flesh → Forge the Form → Ascend
- **Positioning:** Premium, individualised physique coaching built around mastery, form, evidence, recovery, and intentional progression.

### Core idea

Get Divine is not a loud bodybuilding app, a punishment culture, or a generic fitness dashboard. It should feel like a private coaching atelier: disciplined, precise, calm, ceremonial, and highly personal.

### Experience principles

- **Individual by design:** The client profile drives the programme.
- **Progress you can prove:** Important decisions connect to recorded evidence.
- **Built for longevity:** Pain, recovery, technique, and sustainability matter.
- **Coached with intention:** Software supports the coach; it does not replace coach judgment.
- **Deep internally, simple at the point of use:** Complex coaching logic must become clear client actions.

---

## 3. Visual Character

The digital product should feel:

- Dark, luxurious, disciplined, and editorial
- Ceremonial at key moments
- Quiet and highly legible during practical tasks
- Structured rather than decorative
- Premium through proportion, typography, spacing, and restraint

It must not feel:

- Like a neon gym app
- Like a gaming interface
- Like a cryptocurrency dashboard
- Like a generic SaaS template
- Aggressive, chaotic, crowded, or motivational-poster-like
- Overloaded with gold, glass effects, gradients, shadows, or all-caps text

### Ceremonial vs. operational surfaces

Use the dramatic brand expression selectively.

- **Ceremonial surfaces:** public hero, programme introduction, phase transition, major achievement, first portal welcome, and document-style cover moments.
- **Operational surfaces:** forms, live workout logging, programme building, tables, filters, check-ins, history, and coach review.

Ceremonial surfaces may use centred composition, larger serif typography, fine gold rules, and generous negative space. Operational surfaces must prioritise speed, clarity, compact hierarchy, and mobile usability.

**NEVER** turn every card or page section into a miniature black-and-gold cover.

---

## 4. Colour System

Use semantic CSS variables. Do not insert new hard-coded colours inside components.

```css
:root {
  /* Core surfaces */
  --gd-ink: #090907;
  --gd-ink-soft: #11100d;
  --gd-charcoal: #1a1814;
  --gd-surface: #15130f;
  --gd-surface-raised: #1d1a15;
  --gd-paper: #f7f3ea;

  /* Text */
  --gd-ivory: #f3eddf;
  --gd-ivory-soft: #e8dfcd;
  --gd-text-muted: #a7a093;
  --gd-text-faint: #777168;

  /* Brand accent */
  --gd-gold: #c7a45b;
  --gd-gold-bright: #dfbf77;
  --gd-gold-deep: #8e6a1d;
  --gd-gold-muted: #8c713e;

  /* Lines and overlays */
  --gd-line: rgba(199, 164, 91, 0.34);
  --gd-line-soft: rgba(243, 237, 223, 0.12);
  --gd-overlay: rgba(9, 9, 7, 0.72);

  /* Status */
  --gd-success: #92ad7a;
  --gd-warning: #d2a85f;
  --gd-danger: #c87162;
  --gd-info: #8fa8b8;
}
```

### Colour usage rules

- Near-black and charcoal carry most of the interface.
- Ivory is the default text colour on dark surfaces.
- Gold indicates brand hierarchy, selection, focus, and premium detail—not ordinary body text.
- Muted grey-beige supports secondary information.
- Red is reserved for genuine risk, destructive actions, failed states, and pain warnings.
- Green is reserved for confirmed success or safe completion.
- Status must never be communicated through colour alone.
- Gold body paragraphs are prohibited.
- Large gold-filled areas are prohibited.
- Avoid pure white and pure black when the established ivory and near-black tokens are available.

### Suggested distribution

- 70–80% near-black/charcoal surfaces
- 15–25% ivory and muted text
- 3–7% gold accent
- Under 3% semantic status colours

---

## 5. Typography

Use only the self-hosted fonts already stored in `public/fonts`.

```css
:root {
  --gd-font-display: "Cormorant Garamond", "Times New Roman", serif;
  --gd-font-ceremonial: "Cinzel", Georgia, serif;
  --gd-font-sans: "DM Sans", Arial, sans-serif;
}
```

### Roles

- **Cormorant Garamond:** expressive headlines, editorial statements, phase titles, quotations, and major result summaries.
- **Cinzel:** wordmark, eyebrow labels, ceremonial markers, compact badges, and selective navigation labels.
- **DM Sans:** body copy, forms, buttons, field labels, tables, workout data, charts, timers, and all high-frequency interaction.

### Type scale

Use `clamp()` for large responsive headings.

```css
:root {
  --gd-text-xs: 0.75rem;
  --gd-text-sm: 0.875rem;
  --gd-text-base: 1rem;
  --gd-text-lg: 1.125rem;
  --gd-text-xl: 1.375rem;
  --gd-text-2xl: 1.75rem;
  --gd-text-3xl: clamp(2.1rem, 5vw, 3.5rem);
  --gd-text-hero: clamp(3.5rem, 10vw, 7.5rem);
}
```

### Typography rules

- Body text must be readable before it is decorative.
- Default body line height: `1.55–1.7`.
- Data-heavy controls and tables: `1.3–1.45`.
- Serif italic is suitable for brief manifesto or emotional lines, not instructions.
- All-caps labels use Cinzel or DM Sans with generous letter spacing.
- All-caps paragraphs are prohibited.
- Use sentence case for buttons, fields, help text, and operational headings.
- Avoid more than three typographic levels in one card.
- Do not simulate headings with arbitrary font sizes; use reusable classes or components.

### Recommended tracking

- Wordmark/ceremonial label: `0.14em–0.24em`
- Small eyebrow: `0.12em–0.18em`
- Buttons and navigation: `0.02em–0.06em`
- Body text: normal tracking

---

## 6. Spacing, Grid, and Geometry

Use an 8px-based spacing system with 4px available for fine adjustment.

```css
:root {
  --gd-space-1: 0.25rem;
  --gd-space-2: 0.5rem;
  --gd-space-3: 0.75rem;
  --gd-space-4: 1rem;
  --gd-space-5: 1.5rem;
  --gd-space-6: 2rem;
  --gd-space-7: 3rem;
  --gd-space-8: 4rem;
  --gd-space-9: 6rem;

  --gd-radius-sm: 0.375rem;
  --gd-radius-md: 0.625rem;
  --gd-radius-lg: 1rem;
  --gd-radius-pill: 999px;

  --gd-content: 1200px;
  --gd-reading: 720px;
  --gd-control-height: 44px;
}
```

### Layout rules

- Desktop content width should normally stay within `1200px`.
- Long prose should stay within `680–760px`.
- Page gutters: 16px mobile, 24px tablet, 32–48px desktop.
- Section spacing should be generous on public pages and tighter in task flows.
- Cards within one group must share consistent padding and alignment.
- Use borders and spacing before using shadows.
- Rounded corners must remain restrained. Avoid soft, bubbly, consumer-app geometry.
- No horizontal page overflow at any breakpoint.

### Borders and shadows

- Standard border: `1px solid var(--gd-line-soft)`.
- Selected or ceremonial border: `1px solid var(--gd-line)`.
- Gold borders should be thin, not glowing.
- Use shadows sparingly and keep them dark and diffuse.
- Do not add neon glows.

---

## 7. Page Hierarchy

Each page should use this hierarchy where relevant:

1. Small eyebrow or context label
2. One clear page title
3. One short orienting sentence
4. Primary action or status
5. Main content
6. Secondary/supporting content

### Public pages

- Use generous negative space.
- Maintain a strong editorial focal point.
- Keep calls to action limited and deliberate.
- Use gold ornaments only to frame or punctuate hierarchy.

### Client portal

The client should immediately understand:

- What phase they are in
- What programme is active
- What they should do next
- What is required vs. optional
- What progress or feedback has changed

The primary next action should be visible without searching.

### Coach command centre

- Prioritise triage, risk, adherence, and decisions.
- Use compact, scannable data presentation.
- Keep private coaching notes visually and technically separated from client-visible feedback.
- Filters should be easy to reset.
- Drawers and detail views should preserve context rather than forcing unnecessary navigation.

---

## 8. Component Standards

### Buttons

Use three levels only:

1. **Primary:** gold or ivory emphasis for the single main action.
2. **Secondary:** outlined or quiet filled surface.
3. **Tertiary:** text action for low-emphasis tasks.

Rules:

- Minimum height: 44px.
- Mobile primary actions may become full width.
- Button text uses an action verb.
- Only one primary action should dominate a view.
- Destructive actions must never use the primary gold style.
- Loading buttons must retain their width and show a clear status.

### Forms

- Labels remain visible; placeholders do not replace labels.
- Field help and validation sit close to the field.
- Required status is stated in text.
- Use grouped sections rather than one uninterrupted form.
- Preserve entered data when navigating between steps.
- Error messages explain how to fix the problem.
- Long forms need progress, section titles, and draft protection.
- Avoid full-grid spreadsheet styling for human questionnaires.

### Cards

- Cards group one coherent idea or action.
- Do not place every paragraph inside a card.
- Avoid cards within cards unless the nesting expresses a real hierarchy.
- Use a consistent header, body, metadata, and action pattern.
- Selected, completed, locked, required, and optional states must have text/icon reinforcement.

### Navigation

- Keep labels short and stable.
- Active location must be visually obvious.
- Mobile navigation must remain reachable and must not obscure critical content.
- Coach and client navigation should not expose routes or controls belonging to the other role.

### Tables and dense workout data

- Desktop tables may use columns where comparison matters.
- Mobile layouts must transform set rows into labelled stacked cards/rows.
- Keep prescribed targets separate from actual results.
- Numbers should align consistently.
- Sticky headers are allowed when they improve long lists.
- Never shrink operational text below a readable size to preserve a desktop table.

### Modals and confirmations

- Use a modal only when the user must decide before continuing.
- Destructive actions require explicit confirmation and a named target.
- Closing a modal must not silently discard meaningful work.
- Mobile modals may become bottom sheets or full-screen task views.

### Toasts and alerts

- Toasts confirm short-lived results.
- Persistent risk, pain, or blocked states belong inline.
- Alerts should state what happened and what the user should do.
- Do not use celebratory success styling for routine autosaves.

### Empty states

Every empty state should contain:

- What is absent
- Why it may be absent
- The next valid action

Do not use fake metrics or misleading sample activity in a real empty state.

---

## 9. Workout Experience Rules

### Programme selection

- The active assigned split appears first.
- Coach-defined workout names are authoritative.
- Clients select a workout; they do not type arbitrary workout names.
- Main programme sessions are visually distinct from optional sessions.
- Recovery/Cardio and Weak-Point Work appear under **Optional Sessions**.
- Optional sessions explicitly state that they do not count toward required adherence.

### Active workout

The live session is an operational surface. It must be fast, stable, and readable.

- Show programme, phase, week, and session context.
- Show previous, prescribed, and actual values as three distinct concepts.
- Preserve coach cues without crowding the logging controls.
- Make set completion possible with one tap.
- Use a visible rest timer with pause, add time, and skip controls.
- Autosave after every meaningful change.
- Restore the session after refresh or accidental navigation.
- Use sticky mobile session actions.
- Confirm workout cancellation and final completion.

### Set states

Support:

- Warm-up
- Working
- Back-off
- Drop
- Failure

Set type must be written, not communicated only by colour.

### Pain and recovery

- Pain reporting must be clear, private, and visible to the coach.
- Sharp/worsening pain requires a persistent stop warning.
- Numbness, tingling, instability, or major weakness requires a qualified-assessment recommendation.
- The app must not diagnose.
- Poor recovery should discourage optional work before core programme changes.

### Progression

- The system may calculate suggestions.
- Every programme-changing suggestion must say **Coach review required**.
- Never automatically change exercises, loading, volume, deloads, or programme structure.
- Personal milestones and coach recognition replace public leaderboards.

---

## 10. Data Visualisation

- Use charts only when they clarify a trend or comparison.
- Every chart needs a clear title, unit, period, and accessible text summary.
- Use restrained gold for the primary series and muted neutrals for context.
- Red should represent genuine negative/risk meaning, not decoration.
- Avoid 3D charts, gradients, excessive gridlines, and decorative animations.
- Never show a chart with too little data to support the implied trend.
- Progress charts must distinguish actual records from targets or projections.

---

## 11. Motion

Motion should feel deliberate and quiet.

- Standard transitions: `150–240ms`.
- Page/large-panel transitions: up to `320ms`.
- Use ease-out for entering and ease-in for leaving.
- Animate opacity and transform where possible.
- Avoid bouncing, spinning decoration, parallax-heavy movement, and constant ambient animation.
- Rest timers may pulse subtly near completion.
- Respect `prefers-reduced-motion`.
- Motion must never delay logging a set or opening a critical control.

---

## 12. Icons and Imagery

### Icons

- Use one consistent icon family.
- Prefer fine or medium strokes.
- Icons support labels; they do not replace unfamiliar labels.
- Do not mix outline, filled, cartoon, and 3D icon styles.
- Decorative bodybuilding silhouettes are not part of the core system.

### Imagery

When imagery is used, prefer:

- Controlled editorial lighting
- Athletic form and movement
- Dark neutral environments
- Sculptural composition
- Real coaching detail rather than generic “fitness motivation”

Avoid:

- Stock-photo smiles with no coaching context
- Extreme sweat/punishment imagery
- Neon gym photography
- Before/after exploitation
- Imagery that implies guaranteed outcomes

---

## 13. Voice and Content Style

### Voice

The voice is:

- Authoritative but not domineering
- Premium but not pretentious
- Motivational but not theatrical in every sentence
- Evidence-aware but not needlessly academic
- Honest, precise, and humane
- Direct at the point of action

### Use

- “Your next session is Upper A.”
- “Repeat this load until all working sets meet the target range.”
- “Optional work does not count toward required adherence.”
- “Coach review required.”
- “Stop this exercise if pain becomes sharp or worsens.”
- “Built for the person, not copied from a template.”

### Avoid

- “Destroy yourself.”
- “No pain, no gain.”
- “Earn your food.”
- “Pain is weakness.”
- Guaranteed results or timelines
- Shaming language
- Calling a client lazy, undisciplined, bad, or a failure
- Dense scientific explanations when one clear action is enough

### UI writing

- Buttons: short action verbs
- Errors: cause + correction
- Empty states: absence + reason + next action
- Tooltips: one idea, one or two sentences
- Headings: specific rather than clever
- Avoid excessive exclamation marks

---

## 14. Accessibility and Mobile

### Accessibility requirements

- Meet WCAG AA contrast for functional text and controls.
- All controls must work by keyboard.
- Visible focus states are mandatory.
- Use semantic HTML before ARIA.
- Inputs require programmatic labels.
- Timer and set-completion updates use appropriate `aria-live` behaviour.
- Do not use colour alone for meaning.
- Respect reduced motion.
- Use meaningful page titles and heading order.

### Mobile requirements

- Design mobile at the same time as desktop.
- Minimum tap target: 44×44px.
- No horizontal overflow.
- Keep critical actions within thumb reach.
- Convert tables to labelled stacked rows when necessary.
- Use sticky controls carefully so they do not cover inputs.
- Test at 320px, 375px, 390px, 768px, 1024px, and desktop widths.
- Test mobile keyboard behaviour for every form and workout entry screen.

---

## 15. Privacy and Role Boundaries

- Private coach notes must never appear in client-facing views.
- Client-visible feedback and private notes must use separate fields and components.
- Do not use CSS hiding as the only privacy boundary.
- Coach and client experiences must have distinct authorised data access.
- Do not place real client data in seed content, screenshots, logs, or public pages.
- Do not expose private pain, health, body, nutrition, or adherence data in public UI.
- Local prototype limitations must not be disguised as real authentication or cross-device security.

---

## 16. Implementation Rules

### Architecture

Antigravity must preserve:

- React 19
- Vite 6
- TypeScript
- React Router DOM v7
- Vanilla CSS design system
- Self-hosted font files
- Existing route architecture unless a requested feature requires a new route
- Backward-compatible data handling

### CSS

- Add or extend global tokens before hard-coding local values.
- Prefer reusable component classes and clear modifiers.
- Keep page-specific CSS scoped by a page/component class.
- Avoid `!important` except for a documented compatibility reason.
- Do not introduce Tailwind, CSS-in-JS, Bootstrap, Material UI, or another design system without explicit approval.
- Do not reintroduce Google Fonts or other runtime font requests.

### Components

- Reuse components for repeated UI patterns.
- Do not create a universal mega-component with many unrelated modes.
- Keep data logic out of purely presentational elements.
- Preserve strong TypeScript types; avoid `any`.
- Add safe empty, loading, error, and success states.

### Change discipline

- Do not initialise another Git repository.
- Do not overwrite `.env` or credentials.
- Do not remove working features to simplify an update.
- Do not rename established tokens, routes, or data fields casually.
- Do not redesign unrelated pages.
- Run the production build after every meaningful update.

---

## 17. Reusable Page Patterns

### Ceremonial hero

```text
EYEBROW
GET DIVINE
Short editorial promise
One primary action + one quiet secondary action
Fine gold rule or compact status
```

### Operational page header

```text
Context / phase / athlete
Clear page title                         Primary action
One-sentence orientation
Relevant status or filters
```

### Workout card

```text
REQUIRED or OPTIONAL
Upper A
6 exercises • Approx. 70 min
Last completed: 18 July
[Start workout]
```

### Decision callout

```text
COACH REVIEW REQUIRED
Repeat the current load.
All prescribed sets have not yet reached the top of the rep range.
```

### Pain warning

```text
STOP AND REVIEW
You reported sharp or worsening pain.
Stop heavy loading for this exercise and contact your coach or a qualified professional.
```

---

## 18. “Never Do This” List

Antigravity must never:

- Convert the project to another framework without approval.
- Introduce another design system without approval.
- Use random colours or fonts.
- Add neon gradients, glow effects, or loud bodybuilding graphics.
- Overuse gold.
- Make every surface ceremonial.
- Hide labels inside placeholders.
- Communicate state only through colour.
- Create desktop tables that overflow on mobile.
- Shrink text until a broken layout appears to fit.
- Expose private coaching notes to clients.
- Automatically change a client programme.
- Present optional sessions as mandatory.
- Use punishment, shame, diagnosis, or guaranteed-result language.
- Clear all local data during migration.
- Claim localStorage provides true cross-device authentication or security.
- Deploy automatically unless explicitly asked.

---

## 19. Acceptance Checklist

Before presenting any update as complete, Antigravity must confirm:

### Brand

- [ ] The screen unmistakably belongs to Get Divine.
- [ ] Gold is restrained and purposeful.
- [ ] Typography follows the defined roles.
- [ ] The page is not over-decorated.
- [ ] Ceremonial and operational hierarchy are appropriate to the task.

### UX

- [ ] The primary action is immediately clear.
- [ ] Required and optional states are written explicitly.
- [ ] Empty, loading, error, and success states exist where needed.
- [ ] Destructive actions require confirmation.
- [ ] Autosave/draft recovery is present for meaningful long tasks.

### Mobile and accessibility

- [ ] No horizontal overflow exists at 320px and above.
- [ ] Tap targets are at least 44px.
- [ ] Keyboard navigation and visible focus work.
- [ ] Labels remain visible.
- [ ] Colour is not the only carrier of meaning.
- [ ] Reduced motion is respected.

### Privacy and coaching logic

- [ ] Private coach data remains private.
- [ ] Programme changes require coach action.
- [ ] Pain and recovery rules are safely worded.
- [ ] Optional work does not distort required adherence.

### Engineering

- [ ] Existing architecture is preserved.
- [ ] Existing data is backward compatible.
- [ ] No runtime font request was introduced.
- [ ] No unrelated page was redesigned.
- [ ] `npm run build` passes without TypeScript errors.
- [ ] Changed files, migration notes, tests, and limitations are reported.

---

## 20. Standard Antigravity Instruction

Use this at the beginning of future requests:

```text
Read GET_DIVINE_STYLE_GUIDE.md before making changes.

Implement this request inside the currently opened Get Divine repository.
Preserve the React 19 + Vite 6 + TypeScript + React Router + vanilla CSS architecture.
Reuse the existing tokens and components. Do not redesign unrelated pages.
The result must follow every applicable brand, mobile, accessibility, privacy,
coaching-control, and acceptance rule in the style guide.

Before finishing:
1. Run npm run build.
2. Test the affected workflow on desktop and mobile.
3. Confirm no private coach information is exposed.
4. List changed files, migration notes, test results, and any limitation.
5. Do not deploy automatically.
```

---

## 21. Source Alignment

This guide consolidates the established visual and coaching system from:

- Get Divine Client Self-Assessment Form
- Sahmi El Athlete Profile
- The Ascension Program Master Blueprint
- Personalized Nutrition Plan, Meal System & Stock Guide

When the documents and an unapproved visual trend conflict, the Get Divine system wins.
