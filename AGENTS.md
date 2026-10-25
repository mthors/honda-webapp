<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->

## Git Ownership and Version Control Safety

**The human project owner exclusively controls all Git commits and pushes.**

The agent may:
- Inspect Git status, logs, diffs, branches, and remotes using read-only commands.
- Implement changes and run tests.
- Review its own changes and report the files modified.
- Recommend a commit message for the completed milestone.

The agent must never:
- Run `git commit`, `git push`, `git commit --amend`, `git reset`, `git rebase`, or any command that rewrites or publishes Git history.
- Stage files with `git add` unless explicitly requested by the project owner.
- Change branches, remotes, or upstream tracking without explicit permission.
- Claim a milestone has been committed or pushed when the project owner has not done so.

At the end of each milestone, leave implementation changes in the working tree and provide:
1. A summary of changes.
2. Test and validation results.
3. The output of read-only Git status and diff checks.
4. Any known limitations or manual checks required.
5. A suggested commit message.

Then stop and wait for the project owner to review, commit, and push the changes.

**This rule overrides any conflicting milestone prompt or default agent workflow instruction.**
