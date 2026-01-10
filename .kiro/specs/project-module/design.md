# Design Document: Project Module

## Overview

The Project Module extends the existing grievance management system with comprehensive project management capabilities. It follows the established architectural patterns including service-layer abstraction, controller-based routing, Joi validation, and permission-based authorization.

The module introduces three new MongoDB models (Project, Board, Task) that integrate with existing models (Organization, User, Attachment). The design leverages the existing LexoRank service for task ordering and the Attachment service for file management.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Routes Layer                             │
│  project.route.js │ board.route.js │ task.route.js              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Middleware Layer                            │
│         auth.middleware.js (checkPermission, isLoggedIn)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Controllers Layer                            │
│  project.controller.js │ board.controller.js │ task.controller  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                              │
│  project.service.js │ board.service.js │ task.service.js        │
│                    attachment.service.js (existing)              │
│                    lexorank.service.js (existing)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Models Layer                               │
│  project.model.js │ board.model.js │ task.model.js              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Models

#### Project Model (`backend/models/project.model.js`)

```javascript
const projectSchema = new mongoose.Schema({
  organization_id: { type: ObjectId, ref: "Organization", required: true },
  name: { type: String, required: true, trim: true },
  key: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  project_type: { type: String, enum: ["software", "business", "service_desk"], default: "software" },
  status: { type: String, enum: ["planned", "active", "on_hold", "completed", "archived"], default: "active" },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date, default: null },
  manager: [{ type: ObjectId, ref: "User" }],
  members: [{ type: ObjectId, ref: "User" }],
  icon: { type: String, default: null },
  created_by: { type: ObjectId, ref: "User" },
  deleted_at: { type: Date, default: null }
}, { timestamps: true });
```

#### Board Model (`backend/models/board.model.js`)

```javascript
const boardSchema = new mongoose.Schema({
  organization_id: { type: ObjectId, ref: "Organization", required: true },
  project_id: { type: ObjectId, ref: "Project", required: true },
  name: { type: String, required: true, trim: true },
  columns: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    order: { type: Number, required: true }
  }],
  created_by: { type: ObjectId, ref: "User" },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });
```

#### Task Model (`backend/models/task.model.js`)

```javascript
const taskSchema = new mongoose.Schema({
  project_id: { type: ObjectId, ref: "Project", required: true },
  issue_key: { type: String, required: true, unique: true },
  type: { type: String, enum: ["task", "bug", "story", "epic", "subtask"], default: "task" },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  status: { type: String, required: true, index: true },
  priority: { type: String, enum: ["lowest", "low", "medium", "high", "highest"], default: "medium" },
  assignee: { type: ObjectId, ref: "User" },
  reporter: { type: ObjectId, ref: "User" },
  due_date: { type: Date, default: null },
  parent_id: { type: ObjectId, ref: "Task", default: null },
  rank: { type: String, index: true },
  attachments: [{ type: ObjectId, ref: "Attachment" }],
  comments: [CommentSchema],
  activity: [ActivitySchema]
}, { timestamps: true });
```

### 2. Services

#### Project Service Interface

```javascript
// project.service.js
module.exports = {
  createProject(session, body, user),      // Returns { isSuccess, project?, message?, code? }
  updateProject(session, id, body, user),  // Returns { isSuccess, data?, message?, code? }
  deleteProject(session, id, user),        // Returns { isSuccess, message?, code? }
  getProjectById(id, user),                // Returns { isSuccess, data?, message?, code? }
  getAllProjects(query, user),             // Returns { isSuccess, data?, pagination?, message?, code? }
  addProjectMembers(session, id, body, user),
  removeProjectMembers(session, id, body, user),
  getProjectMembers(id, user)
};
```

#### Board Service Interface

```javascript
// board.service.js
module.exports = {
  createBoard(session, body, user),
  createDefaultBoard(session, projectId, organizationId, userId),
  updateBoard(session, id, body, user),
  getBoardById(id, user),
  getBoardsByProject(projectId, user),
  deactivateBoard(session, id, user)
};
```

#### Task Service Interface

```javascript
// task.service.js
module.exports = {
  createTask(session, body, user, files),
  updateTask(session, id, body, user),
  updateTaskStatus(session, id, body, user),
  deleteTask(session, id, user),
  getTaskById(id, user),
  getTasksByProject(projectId, query, user),
  addComment(session, taskId, body, user, files),
  updateComment(session, taskId, commentId, body, user),
  deleteComment(session, taskId, commentId, user),
  addAttachment(session, taskId, user, files),
  removeAttachment(session, taskId, attachmentId, user)
};
```

### 3. Controllers

Each controller follows the established pattern:
- Start MongoDB session for write operations
- Call service method
- Handle success/error responses
- Commit/abort transaction

### 4. Routes

#### Project Routes (`/projects`)

| Method | Endpoint | Middleware | Controller |
|--------|----------|------------|------------|
| POST | /create | checkPermission([CREATE_PROJECT]) | createProject |
| GET | /all | checkPermission([VIEW_PROJECT]) | getAllProjects |
| GET | /details/:id | checkPermission([VIEW_PROJECT]) | getProjectById |
| PATCH | /update/:id | checkPermission([UPDATE_PROJECT]) | updateProject |
| DELETE | /delete/:id | checkPermission([DELETE_PROJECT]) | deleteProject |
| POST | /:id/members | checkPermission([UPDATE_PROJECT]) | addProjectMembers |
| DELETE | /:id/members | checkPermission([UPDATE_PROJECT]) | removeProjectMembers |
| GET | /:id/members | checkPermission([VIEW_PROJECT]) | getProjectMembers |

#### Board Routes (`/boards`)

| Method | Endpoint | Middleware | Controller |
|--------|----------|------------|------------|
| POST | /create | checkPermission([UPDATE_PROJECT]) | createBoard |
| GET | /project/:projectId | isLoggedIn | getBoardsByProject |
| GET | /details/:id | isLoggedIn | getBoardById |
| PATCH | /update/:id | checkPermission([UPDATE_PROJECT]) | updateBoard |
| PATCH | /deactivate/:id | checkPermission([UPDATE_PROJECT]) | deactivateBoard |

#### Task Routes (`/tasks`)

| Method | Endpoint | Middleware | Controller |
|--------|----------|------------|------------|
| POST | /create | isLoggedIn, upload.array | createTask |
| GET | /project/:projectId | isLoggedIn | getTasksByProject |
| GET | /details/:id | isLoggedIn | getTaskById |
| PATCH | /update/:id | isLoggedIn | updateTask |
| PATCH | /status/:id | isLoggedIn | updateTaskStatus |
| DELETE | /delete/:id | isLoggedIn | deleteTask |
| POST | /:id/comments | isLoggedIn, upload.array | addComment |
| PATCH | /:id/comments/:commentId | isLoggedIn | updateComment |
| DELETE | /:id/comments/:commentId | isLoggedIn | deleteComment |
| POST | /:id/attachments | isLoggedIn, upload.array | addAttachment |
| DELETE | /:id/attachments/:attachmentId | isLoggedIn | removeAttachment |

### 5. Validators

#### Project Validator

```javascript
const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  key: Joi.string().min(2).max(10).uppercase().alphanum().required(),
  description: Joi.string().max(1000).optional(),
  project_type: Joi.string().valid("software", "business", "service_desk").default("software"),
  status: Joi.string().valid("planned", "active", "on_hold", "completed", "archived").default("active"),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
  manager: Joi.array().items(Joi.string().custom(objectIdValidation)).optional(),
  members: Joi.array().items(Joi.string().custom(objectIdValidation)).optional(),
  icon: Joi.string().optional()
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  project_type: Joi.string().valid("software", "business", "service_desk").optional(),
  status: Joi.string().valid("planned", "active", "on_hold", "completed", "archived").optional(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
  icon: Joi.string().optional()
});
```

#### Task Validator

```javascript
const createTaskSchema = Joi.object({
  project_id: Joi.string().custom(objectIdValidation).required(),
  type: Joi.string().valid("task", "bug", "story", "epic", "subtask").default("task"),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(5000).optional(),
  status: Joi.string().required(),
  priority: Joi.string().valid("lowest", "low", "medium", "high", "highest").default("medium"),
  assignee: Joi.string().custom(objectIdValidation).optional(),
  due_date: Joi.date().optional(),
  parent_id: Joi.string().custom(objectIdValidation).optional()
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(5000).optional(),
  priority: Joi.string().valid("lowest", "low", "medium", "high", "highest").optional(),
  assignee: Joi.string().custom(objectIdValidation).allow(null).optional(),
  due_date: Joi.date().allow(null).optional(),
  type: Joi.string().valid("task", "bug", "story", "epic", "subtask").optional()
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().required(),
  prevRank: Joi.string().allow(null).optional(),
  nextRank: Joi.string().allow(null).optional()
});
```

## Data Models

### Entity Relationships

```
Organization (1) ──────────────────────────────────────────┐
     │                                                      │
     │ has many                                             │
     ▼                                                      │
Project (N) ◄──────────────────────────────────────────────┤
     │                                                      │
     │ has many          has many                           │
     ▼                   ▼                                  │
Board (N)            Task (N)                               │
     │                   │                                  │
     │                   │ has many                         │
     │                   ▼                                  │
     │              Comment (N)                             │
     │                   │                                  │
     │                   │ has many                         │
     │                   ▼                                  │
     └──────────────► Attachment (N) ◄──────────────────────┘
                         │
                         │ uploaded by
                         ▼
                      User (N)
```

### Issue Key Generation

The issue_key follows the pattern: `{PROJECT_KEY}-{SEQUENCE_NUMBER}`

```javascript
async function generateIssueKey(session, projectId) {
  const project = await Project.findById(projectId).session(session);
  const lastTask = await Task.findOne({ project_id: projectId })
    .sort({ createdAt: -1 })
    .session(session);
  
  let sequence = 1;
  if (lastTask) {
    const lastNumber = parseInt(lastTask.issue_key.split('-')[1]);
    sequence = lastNumber + 1;
  }
  
  return `${project.key}-${sequence}`;
}
```

### Activity Tracking Schema

```javascript
const activitySchema = {
  action: {
    type: String,
    enum: ["created", "status_changed", "assignee_changed", "priority_changed", 
           "comment_added", "attachment_added", "updated"],
    required: true
  },
  field: { type: String, default: null },
  from: { type: Mixed, default: null },
  to: { type: Mixed, default: null },
  performed_by: { type: ObjectId, ref: "User", required: true },
  performed_at: { type: Date, default: Date.now }
};
```

### Default Board Configuration

When a project is created, a default board is automatically generated:

```javascript
const defaultColumns = [
  { key: "todo", label: "To Do", order: 0 },
  { key: "in-progress", label: "In Progress", order: 1 },
  { key: "done", label: "Done", order: 2 }
];
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project Key Uniqueness and Normalization

*For any* project creation request with a valid key, the Project_Service SHALL normalize the key to uppercase and trimmed format, and if a project with the same normalized key already exists in the organization, the creation SHALL be rejected with an appropriate error.

**Validates: Requirements 1.1, 1.2, 1.6**

### Property 2: Organization Data Isolation

*For any* query operation (list projects, get project details), the service SHALL return only data belonging to the requesting user's organization, regardless of what IDs are provided in the request.

**Validates: Requirements 1.3, 1.7**

### Property 3: Soft Delete Behavior

*For any* project deletion, the Project_Service SHALL set the deleted_at timestamp rather than physically removing the record, and subsequent list/get operations SHALL exclude soft-deleted projects.

**Validates: Requirements 1.5**

### Property 4: User Organization Validation for Members

*For any* request to add users (members or managers) to a project, the Project_Service SHALL validate that ALL provided user IDs belong to the same organization as the project, rejecting the entire operation if any user is from a different organization.

**Validates: Requirements 2.1, 2.2**

### Property 5: Default Board Creation

*For any* successful project creation, the Board_Service SHALL automatically create exactly one default board with columns "To Do" (order 0), "In Progress" (order 1), and "Done" (order 2).

**Validates: Requirements 3.1**

### Property 6: Issue Key Generation

*For any* task creation within a project, the Task_Service SHALL generate an issue_key following the pattern `{PROJECT_KEY}-{N}` where N is a monotonically increasing integer unique within the project.

**Validates: Requirements 4.1**

### Property 7: LexoRank Assignment and Ordering

*For any* task creation or status update, the Task_Service SHALL assign a valid LexoRank such that tasks within the same status column are orderable by their rank values.

**Validates: Requirements 4.2, 4.3, 8.3**

### Property 8: Assignee Project Membership Validation

*For any* task assignment operation, the Task_Service SHALL validate that the assignee is either a member or manager of the project, rejecting assignments to non-project users.

**Validates: Requirements 4.4**

### Property 9: Subtask Parent Validation

*For any* subtask creation, the Task_Service SHALL validate that the parent_id references an existing task within the same project, rejecting subtasks with invalid or cross-project parent references.

**Validates: Requirements 4.6**

### Property 10: Activity Tracking Completeness

*For any* task modification (creation, status change, assignee change, priority change, field update, comment addition, attachment addition), the Task_Service SHALL append an activity entry with the correct action type, from/to values (where applicable), performer ID, and timestamp.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 6.4, 7.2**

### Property 11: Comment Ownership and Edit Tracking

*For any* comment edit operation, the Task_Service SHALL verify the requesting user is the comment author, update the message, set is_edited to true, and record the edited_at timestamp.

**Validates: Requirements 6.2**

### Property 12: Task Filtering Correctness

*For any* task list query with filters (status, priority, assignee, reporter, type), the returned results SHALL contain only tasks matching ALL specified filter criteria.

**Validates: Requirements 8.1, 8.5**

### Property 13: Permission-Based Access Control

*For any* API request requiring specific permissions (CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, VIEW_PROJECT), the system SHALL return 403 Forbidden if the requesting user lacks the required permission in their role or special_permissions.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 14: Task Access Control

*For any* task creation or update operation, the Task_Service SHALL verify the requesting user is a project member, project manager, or (for updates) the task assignee, rejecting unauthorized requests.

**Validates: Requirements 9.6, 9.7**

### Property 15: Input Validation Rejection

*For any* request with invalid input (project name outside 3-100 chars, project key outside 2-10 alphanumeric chars, task title outside 3-200 chars, task description over 5000 chars, invalid column keys), the system SHALL return 400 Bad Request with detailed error messages.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

## Error Handling

### Error Response Format

All errors follow the existing pattern:

```javascript
{
  success: 0,
  message: "Error description",
  errors: ["Detailed error 1", "Detailed error 2"]  // Optional, for validation errors
}
```

### Error Categories

| Status Code | Scenario |
|-------------|----------|
| 400 | Validation errors, invalid ObjectId, duplicate key |
| 401 | Missing or invalid authentication token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 500 | Internal server error |

### Transaction Handling

All write operations use MongoDB sessions with transaction support:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Service operations
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

## Testing Strategy

### Dual Testing Approach

The module requires both unit tests and property-based tests for comprehensive coverage:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across randomly generated inputs

### Property-Based Testing Configuration

- **Library**: fast-check (JavaScript property-based testing library)
- **Minimum Iterations**: 100 per property test
- **Tag Format**: `Feature: project-module, Property {N}: {property_text}`

### Test Categories

#### Unit Tests
- Validation schema tests (valid/invalid inputs)
- Service method tests with mocked dependencies
- Controller response format tests
- Error handling tests

#### Property-Based Tests
- Project key normalization (Property 1)
- Organization isolation (Property 2)
- Issue key generation uniqueness (Property 6)
- LexoRank ordering (Property 7)
- Activity tracking completeness (Property 10)
- Filter correctness (Property 12)
- Permission enforcement (Property 13)
- Input validation (Property 15)

### Test File Structure

```
backend/
├── __tests__/
│   ├── unit/
│   │   ├── validators/
│   │   │   ├── project.validator.test.js
│   │   │   ├── board.validator.test.js
│   │   │   └── task.validator.test.js
│   │   ├── services/
│   │   │   ├── project.service.test.js
│   │   │   ├── board.service.test.js
│   │   │   └── task.service.test.js
│   │   └── controllers/
│   │       ├── project.controller.test.js
│   │       ├── board.controller.test.js
│   │       └── task.controller.test.js
│   └── property/
│       ├── project.property.test.js
│       ├── task.property.test.js
│       └── generators/
│           ├── project.generator.js
│           ├── task.generator.js
│           └── user.generator.js
```
