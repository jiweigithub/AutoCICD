---
name: tdd
description: Enforce the TDD RED→GREEN→REFACTOR cycle for all code generation
triggers:
  - "follow TDD"
  - "write tests first"
  - "red green refactor"
  - "tdd cycle"
  - "test-driven development"
---

# TDD Cycle Enforcement

## Purpose
Ensure that every line of production code is preceded by a failing test. This skill drives the TDD state machine through three phases: RED (write a failing test), GREEN (write minimal code to pass), and REFACTOR (improve design without changing behavior). The CG Steward uses this skill to gate every code generation session.

## Workflow
1. **RED Phase**: Generate a test file that exercises the desired behavior. Run the test suite to confirm the new test fails with a clear, specific error. Only test files may be created; production code writes are blocked by the NO_WRITE_WITHOUT_RED gate.
2. **GREEN Phase**: Write the minimal implementation code needed to make the test pass. Run the full test suite. If any test fails, iterate on the implementation until all tests are green.
3. **REFACTOR Phase**: Improve the implementation's structure, naming, and performance without adding new behavior. The test suite acts as a safety net — all tests must stay green throughout. After refactoring, run lint and typecheck.

## Constraints
- The CG Steward must not advance from RED to GREEN until at least one failing test is confirmed.
- The CG Steward must not advance from GREEN to REFACTOR without a 100% passing test suite.
- Test files and production files must never be modified in the same commit during RED phase.
- Every LLM invocation during any phase must be traced (NO_LLM_WITHOUT_TRACE).

## Output
A TDD cycle report with:
- Phase transitions: [RED] → [GREEN] → [REFACTOR] timestamps
- Test count: added, modified, removed per phase
- Coverage delta: before and after line/branch coverage percentages
- LLM trace: model, prompt hash, tokens consumed, latency per invocation
- Final status: `cycle_complete` | `cycle_aborted` | `cycle_timeout`
