# Workspace Agent Rules

## Git & Deployment Protocol
- **No Automatic Git Push**: Never run `git push` automatically after editing code or committing. The user will review changes and perform git pushes manually, or explicitly instruct when to push.
- **Strict Implementation Plan Approval**: Always create/present an `implementation_plan.md` artifact first for non-trivial changes, and wait for explicit user review and approval before executing source modifications.
