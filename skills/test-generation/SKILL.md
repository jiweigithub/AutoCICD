---
name: test-generation
description: Generate API test suites from OpenAPI specifications with positive and negative cases
triggers:
  - "generate tests"
  - "create test suite"
  - "openapi test generation"
  - "api test coverage"
  - "generate API tests"
---

# API Test Generation from OpenAPI Specs

## Purpose
Generate comprehensive test suites directly from OpenAPI 3.1 specifications. For every operation (path + method) in the spec, generate both positive test cases (happy path) and negative test cases (error paths: invalid inputs, missing fields, auth failures, rate limiting). Every generated test follows the Arrange-Act-Assert pattern and asserts on specific status codes and response shapes declared in the spec.

## Workflow
1. **Parse Spec**: Read the target OpenAPI 3.1 specification and extract all operations with their request bodies, parameters, response schemas, and status codes.
2. **Generate Positive Tests**: For each operation, generate a test that sends a valid request matching the spec's schema. Assert on the success status code (2xx) and validate the response body against the declared response schema.
3. **Generate Negative Tests**: For each operation, generate tests for: missing required fields, invalid field types, out-of-range values, missing auth headers, and unsupported media types. Assert on the declared error status codes (4xx, 5xx).
4. **Parameterized Tests**: Where a spec declares enum or constrained values, generate parameterized test tables that iterate over boundary values and equivalence classes.
5. **Run and Verify**: Execute the generated test suite. Confirm that positive tests pass against a running instance and negative tests correctly fail with the expected error responses.

## Constraints
- Every spec operation must have at least one positive test and two negative tests.
- Tests must assert on specific HTTP status codes — never `toBeDefined()` or `toBeTruthy()`.
- Generated tests must be idempotent and clean up any created resources.
- Test files must be placed adjacent to the implementation they test (e.g., `src/routes/users.test.ts` for `src/routes/users.ts`).

## Output
A test generation report:
```json
{
  "spec_file": "string",
  "operations_total": 0,
  "positive_tests_generated": 0,
  "negative_tests_generated": 0,
  "parameterized_tables": 0,
  "test_files_created": [],
  "coverage_estimate": { "operations_covered": 0, "status_codes_covered": 0 },
  "status": "generated | generation_failed"
}
```
