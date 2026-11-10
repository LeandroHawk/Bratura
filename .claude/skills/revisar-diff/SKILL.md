---
name: revisar-diff
description: Reviews a branch's changes against the whole repo with four lenses (belongs elsewhere, already exists, generalizable, derivable) plus the repo's own checks, fixes what is unambiguous, asks about the rest, and reviews again. Works for any task (feature, fix, refactor, copy), alone or as the review step of a workflow such as ECC's orch-*. Trigger: /revisar-diff, "revisa os diffs", "faz um review", "veja se não tem coisas redundantes", "tem algo que já existe?", "dá pra derivar ou generalizar?".
---

# Review the diff against the repo

A diff-only read cannot see what already exists beside the changed lines, which is where most
repeats hide. This skill reads the owners first.

## Procedure

1. **Scope.** Base: the branch the work goes into (ask once if unclear). List every changed file,
   untracked ones included (`git add -N .` makes them show in `git diff <base>`).
2. **Rules.** Read the repo's review checklist (`docs/review.md`). If the repo has none, derive the
   owners from its `AGENTS.md` / `CLAUDE.md` and package entry points, and say so.
3. **Owners.** Open every owner the checklist names for the folders touched, before judging.
4. **Lenses.** For each changed file, run the four lenses and the repo checks from the checklist.
   Record each finding with file, lens and the owner it should use.
5. **Fix or ask.** Fix what is unambiguous and keeps behaviour. Ask about names, behaviour
   changes, removed copy and structure, with a proposal for each.
6. **Verify.** The repo's checks (uncached), and for UI screenshots per width and theme plus axe.
7. **Again.** Review the new diff with the same steps. Fixes bring their own repeats; stop when a
   pass finds nothing new, and say how many passes ran.

## Report

Per lens: what ran, on which files, what was fixed, what waits for a decision. Never claim
"nothing left"; name the lenses and checks that ran instead.

## Do not

- Do not judge from the diff alone.
- Do not add a helper while reviewing without running lens 2 on it.
- Do not commit; the person reviews the diff first.
