# Workforce Data Pipeline MVP Design

## 1. Purpose

This document defines the first implementation slice of Workforce OS: a management-console-centered MVP for collecting worker attendance, importing daily assignments from a fixed Excel format, and accumulating per-task work experience.

The goal of this MVP is to replace memory- and spreadsheet-only operations with a single internal system that preserves the current field workflow while producing reliable structured data for later recommendation and monitoring features.

## 2. MVP Goal

The MVP must allow an authenticated manager to:

- log in to the internal console
- register today's attendance
- create a new worker during attendance registration when needed
- upload a fixed-format Excel assignment sheet
- save daily assignments for attended workers
- accumulate per-worker task experience counts
- search workers by phone number and review recent work history

## 3. Non-Goals

This MVP explicitly does not include:

- automatic assignment decisions
- recommendation ranking UI
- real-time operational headcount dashboard
- payroll or settlement features
- mobile app flows
- worker-facing permissions or self-service screens

Those features are intentionally deferred so that the first release can focus on producing correct attendance, assignment, and skill-history data.

## 4. Product Boundaries

This system starts as a manager-only internal web console built with Next.js and Supabase.

Operational flow for the MVP:

1. The manager logs in.
2. The manager registers today's attending workers.
3. New workers, if needed, are created from the attendance screen and marked present for the day.
4. The manager uploads the daily assignment Excel file.
5. The system validates the entire file.
6. If validation succeeds, the system saves assignments and increments worker skill counts atomically.
7. The manager reviews worker history and task experience through search.

This preserves the existing operational order rather than forcing the field team into a new process.

## 5. Core Decisions Confirmed

The following decisions were confirmed during brainstorming and are binding for this MVP:

- The first subproject is the data pipeline MVP only.
- The app uses real Supabase integration from the beginning.
- The app includes manager login.
- Attendance is registered before Excel upload.
- Excel upload reflects assignment data only.
- New workers are created from the attendance screen, not from Excel upload.
- The upload supports one fixed Excel format only.
- If any row fails validation, the entire upload fails.
- The MVP assumes one worker can have only one assignment per day.
- Worker lookup is phone-number based.

## 6. Architecture

### 6.1 High-Level Shape

The MVP uses a management-console-centered architecture:

- Next.js App Router frontend
- Supabase Auth for manager login
- Supabase Postgres as the system of record
- server-side domain actions for attendance, upload validation, assignment creation, and history queries
- SheetJS (`xlsx`) for Excel parsing

The frontend should remain thin. Domain rules must live on the server side so that validation, persistence, and future API reuse stay consistent.

### 6.2 Why This Shape

This structure is the fastest path to a usable internal tool while keeping room for future expansion. It avoids prematurely optimizing for external consumers, but it still creates clean server-side boundaries so that recommendation and monitoring features can be added without rewriting the data layer.

## 7. Screens

### 7.1 Login

Purpose:

- authenticate managers
- block unauthenticated access to the console

### 7.2 Today Operations

Purpose:

- serve as the daily entry point
- show today's attendance count
- show whether an upload has been completed today
- link to attendance, upload, and worker lookup flows

This is not yet the operational monitoring dashboard. It is a lightweight start page.

### 7.3 Attendance Registration

Purpose:

- mark existing workers as present for the selected day
- create a new worker and mark them present in one flow
- display today's attendance list

This screen is the only place in the MVP where new workers are created.

### 7.4 Excel Upload

Purpose:

- accept one fixed-format assignment file
- validate all rows before any write occurs
- display success or row-level failure reasons

This screen is the only assignment input channel in the MVP.

### 7.5 Worker Search and Detail

Purpose:

- search workers by phone number
- show worker identity details
- show recent assignment history
- show task experience counts

## 8. Domain Model

### 8.1 `workers`

Stores worker identity records.

Fields:

- `id`
- `name`
- `phone`
- `created_at`
- `updated_at`

Rules:

- `phone` is unique
- names are display-only and duplicate names are allowed

Status policy:

- `active`, `inactive`, and `dormant` are business states
- for the MVP, status is derived from the most recent attendance date rather than stored as a mutable column
- this avoids stale status values and removes the need for scheduled status maintenance in the first release

### 8.2 `attendances`

Stores daily attendance records.

Fields:

- `id`
- `worker_id`
- `work_date`
- `created_at`

Rules:

- unique constraint on `worker_id + work_date`
- one row means the worker was available for operations that day

### 8.3 `task_types`

Stores supported task categories.

Fields:

- `id`
- `code`
- `label`
- `created_at`

Rules:

- seeded with the agreed warehouse task list
- Excel upload must map to an existing task type

### 8.4 `assignments`

Stores daily worker-to-task assignment records.

Fields:

- `id`
- `worker_id`
- `task_type_id`
- `work_date`
- `source`
- `created_at`

Rules:

- unique constraint on `worker_id + work_date`
- `source` is set to `excel_upload` in this MVP
- this table is the source of truth for work history

### 8.5 `worker_skills`

Stores accumulated experience per worker and task.

Fields:

- `id`
- `worker_id`
- `task_type_id`
- `count`
- `updated_at`

Rules:

- unique constraint on `worker_id + task_type_id`
- `count` increments by one for each successful assignment import for that worker and task

## 9. Excel Format

The MVP supports one fixed Excel format only.

Required columns:

- `name`
- `phone`
- `task`

Assumptions:

- one row represents one worker's assignment for one day
- the upload is scoped to a single work date explicitly selected in the UI before submission
- there is no per-row multi-task handling in this MVP

If field naming or sheet structure changes in the real operation, the team must update the agreed template before uploading. Flexible mapping is intentionally out of scope.

## 10. Upload Validation Rules

Before any database write occurs, the server must validate the entire file.

Each row must satisfy all of the following:

- `name` is present
- `phone` is present and normalized into a valid phone format
- `task` is present
- the phone number exists in `workers`
- the uploaded name matches the existing worker name for that phone number
- the worker has an attendance record for the selected `work_date`
- the task exists in `task_types`
- the same worker is not duplicated within the upload for that date
- the worker does not already have an assignment for that date

Validation policy:

- if any row fails, no assignments or skill counts are written
- the response must include row-level error details that a manager can act on immediately

## 11. Upload Processing Flow

The upload process is a domain operation, not just a file transfer.

Processing sequence:

1. Parse the uploaded file.
2. Normalize and validate all rows.
3. Resolve `worker_id` by phone number.
4. Resolve `task_type_id` by task value.
5. Build the pending assignment set.
6. Build the pending worker skill increments.
7. Write assignments and skill updates in one transaction.
8. Return a success summary.

Atomicity rule:

- `assignments` creation and `worker_skills` updates must succeed together or fail together

This prevents history and experience counts from diverging.

## 12. Server Responsibilities

The server layer is responsible for business correctness.

### 12.1 Authentication

- verify logged-in manager access
- protect all non-login routes

### 12.2 Worker Operations

- look up workers by phone number
- create workers during attendance registration
- return worker detail and history

### 12.3 Attendance Operations

- register attendance for a specific date
- prevent duplicate attendance rows
- list today's attended workers

### 12.4 Upload Operations

- parse the fixed Excel template
- validate every row
- enforce all-or-nothing writes
- create assignments
- increment worker skill counts
- return success or structured validation failures

## 13. Query Behavior

### 13.1 Worker Lookup

Primary lookup input is phone number. Name search may be added later, but phone search is the authoritative method for avoiding duplicate identities.

### 13.2 Worker Detail

Worker detail should show:

- name
- phone
- derived status based on last attendance
- recent assignments in descending date order
- per-task experience counts

### 13.3 Today Operations Summary

The start page should show:

- today's attendance count
- whether assignment upload has been completed
- the number of assignments imported for today

## 14. Error Handling

The MVP should optimize for operational clarity over permissive behavior.

### 14.1 Attendance Errors

Examples:

- duplicate attendance for the same worker and date
- invalid phone format
- attempt to create a worker with a duplicate phone number

### 14.2 Upload Errors

Examples:

- missing required columns
- unsupported sheet structure
- invalid phone format
- worker not found
- uploaded name does not match the registered worker name for that phone number
- worker not registered in attendance for the selected date
- unknown task type
- duplicate worker rows in the same upload
- existing assignment already recorded for that worker and date

Error responses must identify the row number and failure reason so that the manager can fix the source file quickly.

## 15. Security and Access

The MVP uses a single manager role.

Security expectations:

- all app routes except login require authentication
- database access is scoped to authenticated manager actions
- personal data is limited to name and phone number

Role-based permission branching is deferred, but the server boundaries should remain compatible with future role expansion.

## 16. Testing Strategy

Testing for this MVP must focus on operational correctness.

### 16.1 Domain Logic Tests

Cover:

- worker creation during attendance registration
- duplicate attendance rejection
- phone normalization and worker lookup
- Excel validation rules
- one-worker-one-assignment-per-day enforcement
- worker skill count increment logic
- full rollback when any upload row fails

### 16.2 Integration Tests

Cover:

- attendance registration writing expected DB records
- successful upload creating both assignments and skill counts
- failed upload producing no partial writes

### 16.3 Critical UI Flow Tests

Cover:

- manager login
- attendance registration for an existing worker
- attendance registration for a new worker
- upload success flow
- upload failure flow with visible row-level errors
- phone-based worker history lookup

## 17. Seed and Setup Expectations

The MVP will need seeded `task_types` data before operations begin. The initial seeded list should match the warehouse task categories already defined in the PRD.

Manager authentication setup must exist before internal testing starts.

## 18. Deferred Features Enabled by This MVP

This design intentionally prepares the system for later phases:

- recommendation can read from `attendances`, `assignments`, and `worker_skills`
- operational monitoring can aggregate assignment counts by task and compare them to future target headcount settings
- richer analytics can build on the same normalized event data

## 19. Final Design Summary

The first Workforce OS release should be a manager-only internal console that captures attendance first, imports a fixed assignment Excel sheet second, and stores worker history plus task experience counts reliably.

Its defining principle is strict data integrity:

- new workers are created during attendance registration
- uploads do not create workers
- uploads fail completely if any row is invalid
- assignment history and skill accumulation are written atomically

This creates a trustworthy operational data foundation for the next phases: recommendation and real-time monitoring.
