---
name: code-review
description: Run the 6-agent parallel review pipeline against a pull request
triggers:
  - "review this PR"
  - "code review"
  - "run review pipeline"
  - "check my code"
  - "review changes"
  - "validate PR"
---

# Multi-Agent Code Review Pipeline

## Purpose
Execute a comprehensive code review by dispatching a PR diff to at least four specialist agents in parallel. The CR Steward aggregates their findings into a single review report with actionable, policy-gated pass/fail decisions. No single reviewer has veto power alone; the CR Steward applies weighted policy rules to determine the final verdict.

## Workflow
1. **Extract Diff**: The CR Steward runs `git diff` against the PR's base branch and splits the output into reviewable hunks grouped by file.
2. **Parallel Dispatch**: The diff is sent simultaneously to four specialists: Code Reviewer (logic, style, anti-patterns), Security Auditor (SAST, secrets, dependencies), Contract Validator (OpenAPI compliance), and a Context Miner (git history, related issues).
3. **Aggregation**: The CR Steward collects all findings, deduplicates overlapping issues, and normalizes severity levels across specialists.
4. **Policy Evaluation**: Each finding is checked against the active ReviewPolicy set. Blocker-severity findings that violate blocking policies gate the PR.
5. **Report Generation**: A structured review report is emitted with total findings per severity, per category, and per specialist.

## Constraints
- At least 4 specialists must complete their review before aggregation begins.
- Any finding marked `blocker` by a blocking policy must be resolved before the PR can pass.
- The same agent that authored the code must not participate in its review.
- All findings must include file path, line number, severity, category, and a concrete suggestion.

## Output
A JSON review report:
```json
{
  "pr_id": "string",
  "status": "pass | fail | needs_review",
  "summary": "string",
  "total_findings": 0,
  "by_severity": { "info": 0, "warning": 0, "error": 0, "blocker": 0 },
  "by_specialist": { "code_reviewer": 0, "security_auditor": 0, "contract_validator": 0 },
  "blocking_findings": [],
  "policy_violations": [],
  "duration_ms": 0
}
```
