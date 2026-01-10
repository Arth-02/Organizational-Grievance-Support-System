# Design Document: Project Module Frontend

## Overview

The Project Module frontend extends the existing React application with comprehensive project management UI. It follows established patterns including RTK Query for API communication, Redux for state management, shadcn/ui components, and Tailwind CSS for styling. The design mirrors the grievance module's board view while adding project-specific features.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx (Routes)                         │
│  /projects │ /projects/:id │ /projects/:id/settings             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Layout Components                           │
│         Layout.jsx │ Sidebar.jsx │ Header.jsx                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Page Components                             │
│  Projects.jsx │ ProjectBoard.jsx │ ProjectSettings.jsx          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Components                            │
│  TaskBoardView │ TaskCard │ TaskModal │ TaskList │ TaskForm     │
│  ProjectCard │ ProjectForm │ MemberSelector                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI Components                               │
│  Button │ Card │ Dialog │ Select │ Avatar │ Badge │ etc.        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Services (RTK Query)                          │
│  project.service.js │ board.service.js │ task.service.js        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Redux Store                                 │
│  projectSlice.js │ store.js                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. File Structure

```
frontend/src/
├── components/
│   └── page/
│       └── projects/
│           ├── Projects.jsx              # Project list page
│           ├── ProjectCard.jsx           # Project card in list
│           ├── ProjectBoard.jsx          # Main board page
│           ├── ProjectSettings.jsx       # Project settings page
│           ├── ProjectForm.jsx           # Create/edit project form
│           ├── TaskBoardView.jsx         # Kanban board container
│           ├── TaskList.jsx              # Single column with tasks
│           ├── TaskCard.jsx              # Draggable task card
│           ├── TaskModal.jsx             # Task detail modal
│           ├── TaskForm.jsx              # Create task form
│           ├── TaskComments.jsx          # Comments section
│           ├── TaskActivity.jsx          # Activity history
│           ├── MemberSelector.jsx        # Member/assignee picker
│           └── TaskFilters.jsx           # Filter controls
├── services/
│   ├── project.service.js                # Project API endpoints
│   ├── board.service.js                  # Board API endpoints
│   └── task.service.js                   # Task API endpoints
├── features/
│   └── projectSlice.js                   # Project Redux slice
└── validators/
    └── project.js                        # Zod validation schemas
```

### 2. Route Configuration

```javascript
// App.jsx additions
<Route path="/projects" element={
  <PermissionGuard requiredPermissions={["VIEW_PROJECT"]}>
    <Projects />
  </PermissionGuard>
} />
<Route path="/projects/:projectId" element={
  <PermissionGuard requiredPermissions={["VIEW_PROJECT"]}>
    <ProjectBoard />
  </PermissionGuard>
} />
<Route path="/projects/:projectId/settings" element={
  <PermissionGuard requiredPermissions={["UPDATE_PROJECT"]}>
    <ProjectSettings />
  </PermissionGuard>
} />
```

### 3. Service Interfaces

#### Project Service

```javascript
// project.service.js
export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProject: builder.mutation({ ... }),
    getAllProjects: builder.query({ ... }),
    getProjectById: builder.query({ ... }),
    updateProject: builder.mutation({ ... }),
    deleteProject: builder.mutation({ ... }),
    addProjectMembers: builder.mutation({ ... }),
    removeProjectMembers: builder.mutation({ ... }),
    getProjectMembers: builder.query({ ... }),
  }),
});
```

#### Board Service

```javascript
// board.service.js
export const boardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBoardsByProject: builder.query({ ... }),
    getBoardById: builder.query({ ... }),
    updateBoard: builder.mutation({ ... }),
  }),
});
```

#### Task Service

```javascript
// task.service.js
export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTask: builder.mutation({ ... }),
    getTasksByProject: builder.query({ ... }),
    getTaskById: builder.query({ ... }),
    updateTask: builder.mutation({ ... }),
    updateTaskStatus: builder.mutation({ ... }),
    deleteTask: builder.mutation({ ... }),
    addComment: builder.mutation({ ... }),
    updateComment: builder.mutation({ ... }),
    deleteComment: builder.mutation({ ... }),
    addAttachment: builder.mutation({ ... }),
    removeAttachment: builder.mutation({ ... }),
  }),
});
```

### 4. Redux Slice

```javascript
// projectSlice.js
const initialState = {
  currentProject: null,
  view: "board",
  filters: {
    assignee: null,
    priority: null,
    type: null,
    search: "",
    myFilter: "all",
  },
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setCurrentProject,
    setProjectView,
    setProjectFilters,
    resetProjectFilters,
  },
});
```

### 5. Component Specifications

#### Projects.jsx (Project List Page)

```jsx
// Main project list page
- Header with title and "Add Project" button
- Search input for filtering
- Grid of ProjectCard components
- Empty state when no projects
- Loading skeleton during fetch
```

#### ProjectCard.jsx

```jsx
// Project card in list view
Props: { project }
- Project icon/avatar
- Project name and key
- Status badge
- Member avatars (AvatarGroup)
- Click navigates to /projects/:id
```

#### ProjectBoard.jsx

```jsx
// Main board page for a project
- Header with project name, settings link
- Filter controls (TaskFilters)
- TaskBoardView component
- TaskModal (rendered when task selected)
```

#### TaskBoardView.jsx

```jsx
// Kanban board container (similar to GrievanceBoardView)
- DragDropContext wrapper
- Maps board columns to TaskList components
- Handles drag end events
- Manages task state per column
- Infinite scroll per column
```

#### TaskList.jsx

```jsx
// Single column in board (similar to GrievanceList)
Props: { column, tasks, onLoadMore, hasMore }
- Column header with label and count
- Droppable container
- Maps tasks to TaskCard components
- Load more button/infinite scroll
```

#### TaskCard.jsx

```jsx
// Draggable task card (similar to GrievanceCard)
Props: { task, provided, snapshot }
- Issue key badge (e.g., "HRMS-101")
- Task type icon
- Title (truncated)
- Priority badge
- Assignee avatar
- Attachment count
- Click opens TaskModal
```

#### TaskModal.jsx

```jsx
// Task detail modal (similar to GrievanceCardModal)
Props: { taskId, onClose }
- Editable title
- Editable description (rich text)
- Status selector
- Priority selector
- Type selector
- Assignee selector
- Due date picker
- Attachments section
- Comments section (TaskComments)
- Activity section (TaskActivity)
```

#### TaskForm.jsx

```jsx
// Create task form
Props: { projectId, onSuccess, onCancel }
- Title input (required)
- Description textarea
- Type selector
- Priority selector
- Assignee selector
- Attachment upload
- Submit/Cancel buttons
```

#### TaskComments.jsx

```jsx
// Comments section in TaskModal
Props: { taskId, comments }
- List of comments with author, time, message
- Edit/delete buttons for own comments
- New comment input with attachment support
```

#### TaskActivity.jsx

```jsx
// Activity history in TaskModal
Props: { activity }
- Timeline of activity entries
- Shows action, from/to values, performer, time
```

## Data Models

### Frontend State Shape

```javascript
// Redux store shape
{
  project: {
    currentProject: { _id, name, key, ... } | null,
    view: "board" | "list",
    filters: {
      assignee: string | null,
      priority: string | null,
      type: string | null,
      search: string,
      myFilter: "all" | "assigned_to_me" | "reported_by_me"
    }
  },
  // RTK Query cache
  apiService: { ... }
}
```

### Task Type Icons

```javascript
const TASK_TYPE_CONFIG = {
  task: { icon: CheckSquare, color: "blue" },
  bug: { icon: Bug, color: "red" },
  story: { icon: BookOpen, color: "green" },
  epic: { icon: Zap, color: "purple" },
  subtask: { icon: GitBranch, color: "gray" },
};
```

### Priority Configuration

```javascript
const PRIORITY_CONFIG = {
  lowest: { badge: "bg-slate-100 text-slate-700", label: "Lowest" },
  low: { badge: "bg-emerald-100 text-emerald-700", label: "Low" },
  medium: { badge: "bg-amber-100 text-amber-700", label: "Medium" },
  high: { badge: "bg-orange-100 text-orange-700", label: "High" },
  highest: { badge: "bg-red-100 text-red-700", label: "Highest" },
};
```

### Project Status Configuration

```javascript
const PROJECT_STATUS_CONFIG = {
  planned: { badge: "bg-slate-100 text-slate-700", label: "Planned" },
  active: { badge: "bg-emerald-100 text-emerald-700", label: "Active" },
  on_hold: { badge: "bg-amber-100 text-amber-700", label: "On Hold" },
  completed: { badge: "bg-blue-100 text-blue-700", label: "Completed" },
  archived: { badge: "bg-gray-100 text-gray-700", label: "Archived" },
};
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Permission-Based UI Rendering

*For any* user permission state, UI elements requiring specific permissions (Add Project button, Settings link, Task creation) SHALL be visible only when the user has the corresponding permission (CREATE_PROJECT, UPDATE_PROJECT, project membership).

**Validates: Requirements 1.4, 3.1, 11.1, 14.1, 14.2, 14.3**

### Property 2: Project Card Content Completeness

*For any* project object, the ProjectCard component SHALL render the project name, key, status badge, and member count accurately reflecting the project data.

**Validates: Requirements 1.2**

### Property 3: Project Search Filter Correctness

*For any* search query string, the filtered project list SHALL contain only projects where the name or key contains the search string (case-insensitive).

**Validates: Requirements 1.5**

### Property 4: Form Validation Correctness

*For any* project form input, validation SHALL reject names outside 3-100 characters and keys outside 2-10 uppercase alphanumeric characters, returning appropriate error messages.

**Validates: Requirements 2.2**

### Property 5: Board Column Rendering

*For any* board configuration, the Board_View SHALL render exactly the columns defined in the board's columns array, in the correct order, with accurate task counts per column.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Task Card Content Completeness

*For any* task object, the TaskCard component SHALL render the issue_key, title, type icon, and priority badge. If assignee exists, it SHALL render the assignee avatar. If attachments exist, it SHALL render the attachment count.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 7: Task Status Column Placement

*For any* task with a given status, the task SHALL appear in the column matching that status, and nowhere else.

**Validates: Requirements 4.2**

### Property 8: Drag-Drop Rank Calculation

*For any* task dropped between two existing tasks, the calculated rank SHALL be lexicographically between the previous and next task ranks, ensuring correct ordering.

**Validates: Requirements 6.3**

### Property 9: Task Form Validation

*For any* task form submission, the form SHALL require a non-empty title and accept optional description, priority, type, and assignee fields.

**Validates: Requirements 7.2**

### Property 10: Task Modal Content Completeness

*For any* task object, the TaskModal SHALL display all task fields (title, description, status, priority, type, assignee, due_date), all comments with author and timestamp, and all activity entries.

**Validates: Requirements 8.1, 8.5, 9.1**

### Property 11: Task Filter Correctness

*For any* combination of filters (assignee, priority, type, search, myFilter), the displayed tasks SHALL match ALL applied filter criteria simultaneously.

**Validates: Requirements 10.3, 10.4**

### Property 12: Comment Ownership Enforcement

*For any* comment, edit and delete actions SHALL be available only to the comment author, and hidden for other users.

**Validates: Requirements 9.3, 9.4**

## Error Handling

### API Error Handling

```javascript
// Standard error handling pattern
const handleApiError = (error) => {
  if (error.status === 400) {
    toast.error(error.data?.message || "Invalid request");
  } else if (error.status === 403) {
    toast.error("You don't have permission for this action");
  } else if (error.status === 404) {
    toast.error("Resource not found");
  } else {
    toast.error("An error occurred. Please try again.");
  }
};
```

### Optimistic Update Rollback

```javascript
// Pattern for drag-drop with rollback
const handleDragEnd = async (result) => {
  const originalState = { ...tasks };
  
  // Optimistic update
  setTasks(newState);
  
  try {
    await updateTaskStatus({ id, data });
  } catch (error) {
    // Rollback on failure
    setTasks(originalState);
    toast.error("Failed to update task status");
  }
};
```

### Form Validation Errors

```javascript
// Zod validation with react-hook-form
const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  key: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, "Key must be uppercase alphanumeric"),
});
```

## Testing Strategy

### Component Testing

- Use React Testing Library for component tests
- Test rendering with various props
- Test user interactions (clicks, form submissions)
- Test conditional rendering based on permissions

### Integration Testing

- Test API service hooks with MSW (Mock Service Worker)
- Test Redux state updates
- Test navigation flows

### Key Test Scenarios

1. **Project List**: Renders projects, filters work, navigation works
2. **Project Form**: Validation works, submission calls API
3. **Board View**: Columns render, tasks in correct columns, drag-drop works
4. **Task Card**: All fields render correctly based on task data
5. **Task Modal**: Opens on click, edits work, comments work
6. **Permissions**: UI elements hidden/shown based on permissions

### Test File Structure

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   └── projects/
│   │       ├── Projects.test.jsx
│   │       ├── ProjectCard.test.jsx
│   │       ├── TaskBoardView.test.jsx
│   │       ├── TaskCard.test.jsx
│   │       └── TaskModal.test.jsx
│   ├── services/
│   │   ├── project.service.test.js
│   │   └── task.service.test.js
│   └── validators/
│       └── project.test.js
```
