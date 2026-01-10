# Requirements Document

## Introduction

This document defines the requirements for integrating a Project Management module into the existing grievance management system. The module includes three main entities: Projects, Boards, and Tasks. Projects serve as containers for work items, Boards provide Kanban-style workflow visualization, and Tasks represent individual work items with full lifecycle management including comments, activity tracking, and attachments.

## Glossary

- **Project_Service**: The backend service responsible for project CRUD operations and business logic
- **Board_Service**: The backend service responsible for board management within projects
- **Task_Service**: The backend service responsible for task CRUD operations, comments, and activity tracking
- **Project_Controller**: The Express controller handling HTTP requests for project endpoints
- **Board_Controller**: The Express controller handling HTTP requests for board endpoints
- **Task_Controller**: The Express controller handling HTTP requests for task endpoints
- **LexoRank**: A ranking system used for ordering tasks within board columns
- **Issue_Key**: A unique identifier for tasks in format PROJECT_KEY-NUMBER (e.g., HRMS-101)
- **Organization**: The tenant entity that owns projects, boards, and tasks
- **User**: An authenticated user within an organization

## Requirements

### Requirement 1: Project Management

**User Story:** As an organization admin, I want to create and manage projects, so that I can organize work into logical containers.

#### Acceptance Criteria

1. WHEN a user with CREATE_PROJECT permission creates a project, THE Project_Service SHALL validate the input and create a new project with a unique key within the organization
2. WHEN a project key already exists in the organization, THE Project_Service SHALL reject the creation with an appropriate error message
3. WHEN a user with VIEW_PROJECT permission requests project details, THE Project_Service SHALL return the project with populated manager and member references
4. WHEN a user with UPDATE_PROJECT permission updates a project, THE Project_Service SHALL validate and apply the changes
5. WHEN a user with DELETE_PROJECT permission deletes a project, THE Project_Service SHALL soft-delete by setting deleted_at timestamp
6. THE Project_Service SHALL ensure project keys are uppercase and trimmed
7. WHEN listing projects, THE Project_Service SHALL return only projects belonging to the user's organization with pagination support

### Requirement 2: Project Member Management

**User Story:** As a project manager, I want to manage project members and managers, so that I can control who has access to the project.

#### Acceptance Criteria

1. WHEN a user with UPDATE_PROJECT permission adds members to a project, THE Project_Service SHALL validate that all user IDs belong to the same organization
2. WHEN a user with UPDATE_PROJECT permission adds managers to a project, THE Project_Service SHALL validate that all user IDs belong to the same organization
3. WHEN a user is removed from project members, THE Project_Service SHALL update the members array accordingly
4. THE Project_Service SHALL allow a user to be both a manager and a member of the same project

### Requirement 3: Board Management

**User Story:** As a project manager, I want to create and configure boards for my projects, so that I can visualize workflow stages.

#### Acceptance Criteria

1. WHEN a project is created, THE Board_Service SHALL automatically create a default board with standard columns (To Do, In Progress, Done)
2. WHEN a user creates a custom board, THE Board_Service SHALL validate that the project exists and belongs to the user's organization
3. WHEN a user updates board columns, THE Board_Service SHALL maintain column order integrity
4. WHEN a board is deactivated, THE Board_Service SHALL set is_active to false without deleting associated tasks
5. THE Board_Service SHALL ensure column keys are unique within a board

### Requirement 4: Task Creation and Management

**User Story:** As a project member, I want to create and manage tasks, so that I can track work items within a project.

#### Acceptance Criteria

1. WHEN a user creates a task, THE Task_Service SHALL generate a unique issue_key using the project key and an incrementing number
2. WHEN a user creates a task, THE Task_Service SHALL assign a LexoRank for ordering within the status column
3. WHEN a user updates task status, THE Task_Service SHALL recalculate the rank based on the new position
4. WHEN a user assigns a task, THE Task_Service SHALL validate that the assignee is a member of the project
5. THE Task_Service SHALL support task types: task, bug, story, epic, subtask
6. WHEN a subtask is created, THE Task_Service SHALL validate that the parent_id references a valid task in the same project
7. THE Task_Service SHALL support priority levels: lowest, low, medium, high, highest

### Requirement 5: Task Activity Tracking

**User Story:** As a project member, I want to see the history of changes on a task, so that I can understand how the task evolved.

#### Acceptance Criteria

1. WHEN a task status changes, THE Task_Service SHALL record an activity entry with action "status_changed", from value, to value, and performer
2. WHEN a task assignee changes, THE Task_Service SHALL record an activity entry with action "assignee_changed"
3. WHEN a task priority changes, THE Task_Service SHALL record an activity entry with action "priority_changed"
4. WHEN a task is created, THE Task_Service SHALL record an activity entry with action "created"
5. WHEN any other task field is updated, THE Task_Service SHALL record an activity entry with action "updated" and the field name

### Requirement 6: Task Comments

**User Story:** As a project member, I want to add comments to tasks, so that I can collaborate with team members.

#### Acceptance Criteria

1. WHEN a user adds a comment, THE Task_Service SHALL create a comment entry with author, message, and timestamp
2. WHEN a user edits their own comment, THE Task_Service SHALL update the message and set is_edited to true with edited_at timestamp
3. WHEN a user deletes their own comment, THE Task_Service SHALL remove the comment from the comments array
4. WHEN a comment is added, THE Task_Service SHALL record an activity entry with action "comment_added"
5. THE Task_Service SHALL support attachments on comments

### Requirement 7: Task Attachments

**User Story:** As a project member, I want to attach files to tasks, so that I can share relevant documents.

#### Acceptance Criteria

1. WHEN a user adds attachments to a task, THE Task_Service SHALL use the existing Attachment_Service to upload and store files
2. WHEN attachments are added, THE Task_Service SHALL record an activity entry with action "attachment_added"
3. WHEN a user removes an attachment, THE Task_Service SHALL soft-delete the attachment using Attachment_Service
4. THE Task_Service SHALL limit the number of attachments per task to a configurable maximum

### Requirement 8: Task Filtering and Search

**User Story:** As a project member, I want to filter and search tasks, so that I can find specific work items quickly.

#### Acceptance Criteria

1. WHEN listing tasks, THE Task_Service SHALL support filtering by status, priority, assignee, reporter, and type
2. WHEN listing tasks, THE Task_Service SHALL support text search on title and description
3. WHEN listing tasks, THE Task_Service SHALL return results ordered by rank within each status
4. THE Task_Service SHALL support pagination with configurable page size
5. WHEN filtering by "my tasks", THE Task_Service SHALL return tasks where the user is assignee or reporter

### Requirement 9: Authorization and Access Control

**User Story:** As a system administrator, I want to control access to project features, so that I can maintain security.

#### Acceptance Criteria

1. THE Project_Controller SHALL require CREATE_PROJECT permission for project creation
2. THE Project_Controller SHALL require UPDATE_PROJECT permission for project updates
3. THE Project_Controller SHALL require DELETE_PROJECT permission for project deletion
4. THE Project_Controller SHALL require VIEW_PROJECT permission for viewing project details
5. WHEN a user without proper permissions attempts an action, THE system SHALL return a 403 Forbidden response
6. THE Task_Service SHALL allow task creation only for project members or managers
7. THE Task_Service SHALL allow task updates only for project members, managers, or the task assignee

### Requirement 10: Data Validation

**User Story:** As a developer, I want robust input validation, so that the system maintains data integrity.

#### Acceptance Criteria

1. THE Project_Validator SHALL validate project name is between 3 and 100 characters
2. THE Project_Validator SHALL validate project key is between 2 and 10 uppercase alphanumeric characters
3. THE Task_Validator SHALL validate task title is between 3 and 200 characters
4. THE Task_Validator SHALL validate task description is maximum 5000 characters
5. THE Board_Validator SHALL validate column keys are alphanumeric with hyphens allowed
6. WHEN validation fails, THE system SHALL return a 400 Bad Request with detailed error messages
