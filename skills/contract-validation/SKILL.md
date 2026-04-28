---
name: contract-validation
description: Validate API implementation against OpenAPI specs and consumer pacts
triggers:
  - "validate contract"
  - "check API spec"
  - "openapi compliance"
  - "contract test"
  - "pact verification"
  - "breaking change check"
---

# OpenAPI Contract Validation

## Purpose
Ensure every API implementation conforms exactly to its OpenAPI 3.1 specification and that consumer-driven contracts (Pact) are not broken by provider changes. This skill runs bidirectional validation: spec-to-code (does the implementation match the spec?) and contract-to-provider (do consumer expectations match the provider?).

## Workflow
1. **Load Spec**: Read the target service's OpenAPI 3.1 specification from `.ulw/architecture/` or the service's spec directory.
2. **Spectral Lint**: Run `spectral lint` on the spec file to catch structural errors, missing descriptions, and naming convention violations. Any error-level issue blocks the pipeline.
3. **Implementation Audit**: Use AST search to locate all route handlers in the implementation. Compare each handler's path, method, request body, and response shape against the OpenAPI spec. Flag any handler not declared in the spec (undocumented endpoint) or any spec operation without an implementation (missing endpoint).
4. **Semantic Diff**: Compare the current spec version to the previous deployed version. Detect breaking changes: removed fields, changed types, new required fields, removed operations. Require a major version bump for any breaking change.
5. **Pact Verification**: Query the Pact Broker for all registered consumer pacts. Run provider verification against the current build. Any failing pact blocks deployment.

## Constraints
- Spectral linting must pass with zero errors before proceeding to implementation audit.
- Any endpoint returning an undocumented status code is a blocking finding.
- Removing a response field without a deprecation period (minimum one minor version) is a breaking change.
- Consumer pacts must be verified against the provider before any deployment.

## Output
A contract compliance report:
```json
{
  "service": "string",
  "spec_version": "string",
  "spectral_errors": 0,
  "spectral_warnings": 0,
  "undocumented_endpoints": [],
  "missing_endpoints": [],
  "breaking_changes": [],
  "pact_verification": { "total_pacts": 0, "passed": 0, "failed": 0 },
  "status": "pass | fail | needs_attention"
}
```
