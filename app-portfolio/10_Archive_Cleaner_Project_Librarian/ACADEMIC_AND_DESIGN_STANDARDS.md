# Academic and Design Documentation Standards

## Purpose

This document captures the working standards to use for SeraphimGPT app portfolio documentation, especially EI-RAM Analysis Studio.

It distills local course resources supplied by the operator:

- `Comprehensive_Academic_Writing_and_APA_7th_Guide.pdf`
- `SDD_Template.pdf`
- `SoftwareArchitectureDocumentation.pdf`
- `uml.pdf`
- `Writing for Success.pdf`

Use this file as the project memory for future writing, SDD, requirements, architecture, and UML work.

## Academic Writing Standards

### College-Level Writing

Project documents should move beyond summary into analysis, synthesis, rationale, and evidence-backed decisions.

Writing should:

- State purpose clearly.
- Define scope and audience.
- Use direct, organized sections.
- Support claims with evidence or design rationale.
- Distinguish facts, assumptions, decisions, and open questions.
- Avoid vague filler and unsupported certainty.

### Writing Process

Use a recursive drafting process:

- Plan the document structure.
- Draft the major sections.
- Revise for logic, completeness, and flow.
- Edit for grammar, mechanics, and formatting.
- Proofread final deliverables before submission or export.

### Sentence and Paragraph Quality

Prefer concise, complete sentences with clear subjects and verbs.

Paragraphs should:

- Open with a controlling idea.
- Develop one main point.
- Use transitions where needed.
- Avoid burying key claims inside long sentence chains.

## APA 7 Working Rules

When a document is academic or course-facing, apply APA 7 expectations unless the assignment says otherwise.

### Format

- Use 1-inch margins.
- Use readable academic fonts such as 11-point Calibri, 11-point Arial, or 12-point Times New Roman when producing formal documents.
- Double-space formal academic papers unless the target template requires otherwise.
- Include page numbers in formal deliverables.
- Use consistent heading hierarchy.

### Title Page

Student title pages should include:

- Paper title
- Author name
- Institutional affiliation
- Course number and name
- Instructor name
- Due date

### Headings

Use APA-style heading hierarchy for formal academic papers:

- Level 1: Centered, bold, title case
- Level 2: Flush left, bold, title case
- Level 3: Flush left, bold italic, title case
- Level 4: Indented, bold, title case, period, inline text
- Level 5: Indented, bold italic, title case, period, inline text

For engineering Markdown documents, use clear numbered sections when that better matches the SDD/SRS template.

### Citations

Use author-date in-text citations for paraphrases, summaries, concepts, data, direct quotes, and borrowed frameworks.

Use parenthetical or narrative form consistently:

- Parenthetical: `(Author, Year)`
- Narrative: `Author (Year)`

### References

Formal academic documents should include a `References` section.

Reference entries should:

- Be alphabetized by lead author.
- Use hanging indent in final Word/PDF form.
- Include DOI or URL when applicable.
- Follow APA 7 source patterns.

## SDD Standards

The Software Design Document should follow the local SDD template structure adapted from IEEE 1016.

### Required SDD Sections

1. Introduction
   - Purpose
   - Scope
   - Overview
   - Reference Material
   - Definitions and Acronyms
2. System Overview
3. System Architecture
   - Architectural Design
   - Decomposition Description
   - Design Rationale
4. Data Design
   - Data Description
   - Data Dictionary
5. Component Design
6. Human Interface Design
   - Overview of User Interface
   - Screen Images or Wireframes
   - Screen Objects and Actions
7. Requirements Matrix
8. Appendices

### SDD Quality Rules

An SDD should be useful to programmers.

It should include:

- Enough implementation detail to guide coding.
- Clear component boundaries.
- Interface definitions.
- Data structures and storage decisions.
- Design rationale and tradeoffs.
- Traceability from requirements to components.
- Diagrams or wireframes where they clarify the design.

Avoid:

- Treating the SDD as a marketing overview.
- Leaving architecture choices unexplained.
- Omitting data design.
- Omitting requirements traceability.

## Architecture Documentation Standards

Architecture documentation should describe how the system is structured to satisfy functional requirements and quality attributes.

### Expected Architecture Content

Include:

- Revision history
- Introduction
- Background
- Architecturally significant functional requirements
- Quality attributes
- Architecture overview
- System context
- User interactions
- Data flow
- Patterns and tactics
- Views
- Rationale
- Glossary
- Issues list
- References

### Quality Attributes

For EI-RAM and related apps, explicitly consider:

- Usability
- Availability
- Maintainability
- Testability
- Security
- Auditability
- Local-first operation
- Data portability

Use quality-attribute scenarios where useful:

- Source
- Stimulus
- Artifact
- Environment
- Response
- Response measure

### Architecture Views

Use multiple views when the design is complex:

- System context view
- Logical/layered view
- Process view
- Data view
- Deployment view
- Interface view

Each view should include:

- Diagram
- Notation explanation
- Element catalog
- Relationships
- Interfaces
- Rationale

### Pattern and Tactic Documentation

When choosing an architecture, identify relevant patterns and tactics.

Candidate patterns for EI-RAM:

- Client-server
- Layered architecture
- Model-view-controller or frontend/backend separation
- Repository/data mapper for persistence
- Service layer for analysis and export workflows

Discuss why selected patterns fit the requirements.

## UML Standards

UML diagrams should be used when they clarify system structure, behavior, or interactions.

Use diagram types intentionally:

- Use case diagram: actors and system goals
- Activity diagram: workflow and decision flow
- Class diagram: domain objects and relationships
- Sequence diagram: runtime interactions between user, UI, API, engine, database, and exporter
- Component diagram: deployable or logical components
- Deployment diagram: runtime nodes and where components run

### UML Expectations

Diagrams should:

- Have clear titles.
- Include only relevant elements.
- Use consistent notation.
- Avoid visual clutter.
- Match the written architecture and requirements.
- Be referenced from the document text.

For EI-RAM MVP, prioritize:

- Use case diagram
- Activity diagram for analysis workflow
- Component diagram
- Sequence diagram for analysis and export
- Data/entity diagram or class diagram for Case, AnalysisResult, and ExportRecord

## Requirements Standards

Requirements documents should use stable identifiers.

Recommended prefixes:

- `FR` for functional requirements
- `NFR` for non-functional requirements
- `SR` for safety requirements
- `IR` for interface requirements
- `DR` for data requirements
- `UIR` for user-interface requirements
- `TR` for testing requirements

Each requirement should be:

- Clear
- Testable
- Traceable
- Scoped to MVP or deferred
- Written with shall/should/may intentionally

Use:

- `shall` for required behavior
- `should` for preferred behavior
- `may` for optional or future behavior

## EI-RAM Documentation Rules

For EI-RAM Analysis Studio, always preserve:

- Evidence-first analysis
- Explicit limitations
- Confidence language
- Separation of evidence from inference
- No diagnostic claims
- No certainty claims about intent or danger
- Human analyst responsibility
- Local-first MVP scope

## Future Work Instruction

When creating or revising EI-RAM documents:

1. Check this standards file first.
2. Keep the SDD aligned with the SDD template.
3. Keep requirements traceable by ID.
4. Include architecture rationale and quality attributes.
5. Use UML diagrams where they make the design easier to understand.
6. Add references for external academic or technical claims.
7. Keep MVP and deferred scope separated.
