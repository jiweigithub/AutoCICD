---
name: spec-parsing
description: Parse Markdown specification documents into structured JSON for the ulw SDD+TDD pipeline
triggers:
  - "parse spec"
  - "parse specification"
  - "extract sections"
  - "generate structured spec"
  - "spec to JSON"
  - "SDD markdown parser"
---

# Markdown Spec Parser

## Purpose
Transform Markdown specification documents into Zod-validated StructuredSpec JSON for pipeline Stage 1. The parser reads a Markdown file with well-known section headings (Overview, User Stories, Acceptance Criteria, Data Models, API Contracts, Constraints), extracts structured data from each section, validates completeness and correctness against a Zod schema, and writes the result to the pipeline's stage output path. Downstream stages (Architecture Design, TDD Code Gen) depend on this structured spec as their single source of truth.

## Input
A Markdown document containing these sections (by heading level-2 `##` or level-3 `###`):

- **Overview**: High-level description of the feature or system
- **User Stories**: One or more `As a... I want... So that...` statements, optionally enumerated
- **Acceptance Criteria**: Concrete, testable conditions that must be true for the story to be complete
- **Data Models**: Entity definitions with fields, types, constraints, and relationships
- **API Contracts**: Endpoint definitions with method, path, request/response schemas, and status codes
- **Constraints**: Cross-cutting concerns (performance, security, compliance, architectural)

## Workflow
1. **Read Markdown File**: Load the source `.md` file using the Read tool. Capture the full text content and record the file path for source metadata.

2. **Extract Sections by Heading**: Split the document on level-2 (`##`) and level-3 (`###`) headings. Map each heading text (normalized to lowercase) to one of the six known section types. Any heading that does not match a known type is collected under `extras` for downstream awareness.

3. **Validate Required Sections**: Check that at least Overview and User Stories are present. If either is missing, abort with a clear error listing which required sections were not found. Each missing section includes the expected heading name.

4. **Parse Structured Data from Each Section**:
   - **User Stories**: Match each story against the pattern `As a <role>, I want <goal> so that <reason>`. Extract `role`, `goal`, `reason` as separate fields. Attach the line number from the source Markdown.
   - **Acceptance Criteria**: Split on bullet points or numbered lists. Each criterion becomes a `{ id, description, lineRef }` entry.
   - **Data Models**: Parse entity name from the sub-heading. Extract fields from tables or definition blocks. Each field gets `{ name, type, required, constraints }`.
   - **API Contracts**: Parse endpoint definitions from code blocks or structured lists. Each contract gets `{ method, path, request, response, statusCodes }`.
   - **Constraints**: Each bullet or numbered item becomes a `{ category, description, lineRef }` entry.

5. **Generate structured-spec.json**: Build a JSON object conforming to the StructuredSpec schema:
   ```json
   {
     "specId": "string (UUID)",
     "title": "string",
     "userStories": [
       { "id": "US-1", "role": "string", "goal": "string", "reason": "string", "lineRef": 0 }
     ],
     "acceptanceCriteria": [
       { "id": "AC-1", "description": "string", "lineRef": 0 }
     ],
     "dataModels": [
       { "name": "string", "fields": [ { "name": "string", "type": "string", "required": true, "constraints": [] } ], "lineRef": 0 }
     ],
     "apiContracts": [
       { "method": "GET | POST | PUT | PATCH | DELETE", "path": "string", "request": {}, "response": {}, "statusCodes": [200], "lineRef": 0 }
     ],
     "constraints": [
       { "category": "performance | security | compliance | architectural", "description": "string", "lineRef": 0 }
     ],
     "sourceMetadata": {
       "fileName": "string",
       "filePath": "string",
       "parsedAt": "ISO-8601 timestamp"
     }
   }
   ```

6. **Validate with Zod Schema**: Run the generated object through the StricturedSpec Zod schema (defined in `packages/shared/src/schemas/structured-spec.schema.ts`). If validation fails, collect all Zod error paths and messages, then abort with a detailed validation report.

7. **Write Output**: Write the validated JSON to `pipeline/{pipelineId}/stage-1/structured-spec.json`. Confirm the file was written successfully by reading it back and checking its integrity (valid JSON, non-empty, matches expected specId).

## Constraints
- The Overview and User Stories sections are required. All other sections are optional but encouraged.
- Every extracted item (user story, criterion, field, contract, constraint) must include a `lineRef` pointing to the line number in the source Markdown where it was defined.
- A section heading that appears more than once appends to that section's items rather than overwriting.
- Unrecognized headings must be collected in `extras` and surfaced in a warning, not silently dropped.
- The Zod schema version in the output must match the version field in the spec definition. Schema migration is handled by the pipeline, not the parser.

## Tools
- **Read**: Load the source Markdown file
- **Write**: Write the output JSON to the pipeline artifact path
- **Bash**: Run the Zod schema validation script and optional file integrity check
