# Implementation Plan: Project Module

## Overview

This implementation plan breaks down the Project Module into incremental coding tasks. Each task builds on previous work, ensuring no orphaned code. The plan follows the existing codebase patterns and integrates with existing services (Attachment, LexoRank, Auth middleware).

## Tasks

- [x] 1. Create Project Model and Validator
  - [x] 1.1 Create `backend/models/project.model.js` with schema as defined in design
    - Include indexes for organization_id and key uniqueness
    - _Requirements: 1.1, 1.6_
  - [x] 1.2 Create `backend/validators/project.validator.js` with Joi schemas
    - createProjectSchema, updateProjectSchema, addMembersSchema
    - _Requirements: 10.1, 10.2_
  - [x] 1.3 Write unit tests for project validator
    - Test valid/invalid project names (3-100 chars)
    - Test valid/invalid project keys (2-10 uppercase alphanumeric)
    - _Requirements: 10.1, 10.2_

- [x] 2. Create Board Model and Validator
  - [x] 2.1 Create `backend/models/board.model.js` with schema as defined in design
    - Include compound index for project_id and is_active
    - _Requirements: 3.1, 3.5_
  - [x] 2.2 Create `backend/validators/board.validator.js` with Joi schemas
    - createBoardSchema, updateBoardSchema
    - _Requirements: 10.5_
  - [x] 2.3 Write unit tests for board validator
    - Test valid/invalid column keys
    - _Requirements: 10.5_

- [x] 3. Create Task Model and Validator
  - [x] 3.1 Create `backend/models/task.model.js` with schema as defined in design
    - Include embedded comment and activity schemas
    - Include indexes for project_id, status, rank, issue_key
    - _Requirements: 4.1, 4.5, 4.7, 5.1-5.5, 6.1-6.5_
  - [x] 3.2 Create `backend/validators/task.validator.js` with Joi schemas
    - createTaskSchema, updateTaskSchema, updateTaskStatusSchema, commentSchema
    - _Requirements: 10.3, 10.4_
  - [x] 3.3 Write unit tests for task validator
    - Test valid/invalid task titles (3-200 chars)
    - Test valid/invalid descriptions (max 5000 chars)
    - _Requirements: 10.3, 10.4_

- [x] 4. Checkpoint - Models and Validators Complete
  - Ensure all model files are created and validators pass tests
  - Ask the user if questions arise

- [x] 5. Implement Project Service
  - [x] 5.1 Create `backend/services/project.service.js` with core CRUD operations
    - createProject: validate, normalize key, check uniqueness, save
    - getProjectById: find with populated refs, org check
    - getAllProjects: pagination, org filter, exclude deleted
    - updateProject: validate, apply changes
    - deleteProject: soft delete with deleted_at
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 5.2 Add member management methods to project service
    - addProjectMembers: validate user org membership
    - removeProjectMembers: update members array
    - getProjectMembers: return populated members/managers
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 5.3 Write property test for project key normalization
    - **Property 1: Project Key Uniqueness and Normalization**
    - **Validates: Requirements 1.1, 1.2, 1.6**
  - [x] 5.4 Write property test for organization data isolation
    - **Property 2: Organization Data Isolation**
    - **Validates: Requirements 1.3, 1.7**

- [x] 6. Implement Board Service
  - [x] 6.1 Create `backend/services/board.service.js`
    - createDefaultBoard: create board with standard columns
    - createBoard: validate project, create custom board
    - getBoardById, getBoardsByProject
    - updateBoard: update columns maintaining order
    - deactivateBoard: set is_active false
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 6.2 Write property test for default board creation
    - **Property 5: Default Board Creation**
    - **Validates: Requirements 3.1**

- [x] 7. Implement Task Service - Core Operations
  - [x] 7.1 Create `backend/services/task.service.js` with task CRUD
    - generateIssueKey: create unique PROJECT_KEY-N format
    - createTask: validate, generate key, assign rank, record activity
    - getTaskById, getTasksByProject with filters
    - updateTask: validate, apply changes, record activity
    - deleteTask: remove task
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 7.2 Add status update with rank recalculation
    - updateTaskStatus: change status, recalculate rank using LexoRank
    - _Requirements: 4.3_
  - [x] 7.3 Write property test for issue key generation
    - **Property 6: Issue Key Generation**
    - **Validates: Requirements 4.1**
  - [x] 7.4 Write property test for LexoRank ordering
    - **Property 7: LexoRank Assignment and Ordering**
    - **Validates: Requirements 4.2, 4.3, 8.3**

- [x] 8. Implement Task Service - Comments and Attachments
  - [x] 8.1 Add comment methods to task service
    - addComment: create comment, record activity
    - updateComment: verify ownership, update, set is_edited
    - deleteComment: verify ownership, remove
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 8.2 Add attachment methods to task service
    - addAttachment: use Attachment_Service, record activity
    - removeAttachment: soft delete via Attachment_Service
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 8.3 Write property test for activity tracking
    - **Property 10: Activity Tracking Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 6.4, 7.2**

- [x] 9. Checkpoint - Services Complete
  - Ensure all services are implemented and property tests pass
  - Ask the user if questions arise

- [x] 10. Implement Controllers
  - [x] 10.1 Create `backend/controllers/project.controller.js`
    - Implement all project endpoints with session handling
    - Follow existing controller patterns (grievance.controller.js)
    - _Requirements: 1.1-1.7, 2.1-2.4_
  - [x] 10.2 Create `backend/controllers/board.controller.js`
    - Implement all board endpoints with session handling
    - _Requirements: 3.1-3.5_
  - [x] 10.3 Create `backend/controllers/task.controller.js`
    - Implement all task endpoints with session handling
    - Include multer for file uploads
    - _Requirements: 4.1-4.7, 5.1-5.5, 6.1-6.5, 7.1-7.4, 8.1-8.5_

- [x] 11. Implement Routes
  - [x] 11.1 Create `backend/routes/project.route.js`
    - Wire project endpoints with checkPermission middleware
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 11.2 Create `backend/routes/board.route.js`
    - Wire board endpoints with appropriate middleware
    - _Requirements: 3.1-3.5_
  - [x] 11.3 Create `backend/routes/task.route.js`
    - Wire task endpoints with isLoggedIn and multer
    - _Requirements: 9.6, 9.7_
  - [x] 11.4 Update `backend/routes/index.route.js` to include new routes
    - Add project, board, task routes
    - _Requirements: All_

- [x] 12. Add Permission Constants
  - [x] 12.1 Verify project permissions exist in `backend/utils/constant.js`
    - CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, VIEW_PROJECT already exist
    - Add any additional task-specific permissions if needed
    - _Requirements: 9.1-9.5_

- [x] 13. Checkpoint - Integration Complete
  - Ensure all routes are wired and API endpoints are accessible
  - Ask the user if questions arise

- [x] 14. Implement Authorization Checks in Services
  - [x] 14.1 Add project membership validation to task service
    - Verify user is member/manager before task creation
    - Verify user is member/manager/assignee before task update
    - _Requirements: 9.6, 9.7_
  - [x] 14.2 Write property test for permission-based access control
    - **Property 13: Permission-Based Access Control**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  - [x] 14.3 Write property test for task access control
    - **Property 14: Task Access Control**
    - **Validates: Requirements 9.6, 9.7**

- [x] 15. Final Integration and Validation
  - [x] 15.1 Write property test for input validation rejection
    - **Property 15: Input Validation Rejection**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**
  - [x] 15.2 Write property test for task filtering
    - **Property 12: Task Filtering Correctness**
    - **Validates: Requirements 8.1, 8.5**

- [x] 16. Final Checkpoint
  - Ensure all tests pass
  - Verify all API endpoints work correctly
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows existing patterns from grievance module
