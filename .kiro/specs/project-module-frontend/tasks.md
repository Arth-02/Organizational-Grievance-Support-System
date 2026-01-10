# Implementation Plan: Project Module Frontend

## Overview

This implementation plan breaks down the Project Module frontend into incremental coding tasks. Each task builds on previous work, following the existing patterns from the grievance module. The plan uses RTK Query for API services, Redux for state management, and shadcn/ui components.

## Tasks

- [x] 1. Create API Services
  - [x] 1.1 Create `frontend/src/services/project.service.js`
    - Implement createProject, getAllProjects, getProjectById, updateProject, deleteProject mutations/queries
    - Implement addProjectMembers, removeProjectMembers, getProjectMembers endpoints
    - Follow existing grievance.service.js patterns
    - _Requirements: 1.1, 2.3, 3.5_
  - [x] 1.2 Create `frontend/src/services/board.service.js`
    - Implement getBoardsByProject, getBoardById, updateBoard endpoints
    - _Requirements: 4.1_
  - [x] 1.3 Create `frontend/src/services/task.service.js`
    - Implement createTask, getTasksByProject, getTaskById, updateTask, updateTaskStatus, deleteTask
    - Implement addComment, updateComment, deleteComment endpoints
    - Implement addAttachment, removeAttachment endpoints
    - _Requirements: 6.2, 7.3, 8.6, 9.2_

- [x] 2. Create Redux Slice and Store Integration
  - [x] 2.1 Create `frontend/src/features/projectSlice.js`
    - Define initial state (currentProject, view, filters)
    - Implement setCurrentProject, setProjectView, setProjectFilters, resetProjectFilters reducers
    - _Requirements: 10.3, 10.4_
  - [x] 2.2 Update `frontend/src/store.js` to include projectSlice
    - Add project reducer to store configuration
    - _Requirements: All_

- [x] 3. Create Validation Schemas
  - [x] 3.1 Create `frontend/src/validators/project.js`
    - Define createProjectSchema with Zod (name 3-100 chars, key 2-10 uppercase alphanumeric)
    - Define updateProjectSchema
    - Define createTaskSchema (title required)
    - Define commentSchema
    - _Requirements: 2.2, 7.2_

- [x] 4. Checkpoint - Foundation Complete
  - Ensure services, slice, and validators are created
  - Ask the user if questions arise

- [x] 5. Create Project List Page
  - [x] 5.1 Create `frontend/src/components/page/projects/Projects.jsx`
    - Header with title and "Add Project" button (permission-gated)
    - Search input for filtering projects
    - Grid layout for ProjectCard components
    - Loading skeleton during fetch
    - Empty state when no projects
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 5.2 Create `frontend/src/components/page/projects/ProjectCard.jsx`
    - Display project icon, name, key, status badge
    - Display member count with AvatarGroup
    - Click handler to navigate to /projects/:id
    - _Requirements: 1.2, 1.3_

- [x] 6. Create Project Form
  - [x] 6.1 Create `frontend/src/components/page/projects/ProjectForm.jsx`
    - Form with name, key, description, project_type, status inputs
    - Date pickers for start_date and end_date
    - Member selector for initial members
    - Validation using Zod schema and react-hook-form
    - Submit handler calling createProject or updateProject
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Create Project Settings Page
  - [x] 7.1 Create `frontend/src/components/page/projects/ProjectSettings.jsx`
    - Editable project details form
    - Member management section (add/remove members)
    - Manager management section (add/remove managers)
    - Delete project option (with confirmation)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 7.2 Create `frontend/src/components/page/projects/MemberSelector.jsx`
    - Searchable user selector component
    - Multi-select support for adding multiple users
    - Display selected users with remove option
    - _Requirements: 3.3, 3.4_

- [x] 8. Checkpoint - Project Management Complete
  - Ensure project list, form, and settings work
  - Ask the user if questions arise

- [x] 9. Create Task Board View
  - [x] 9.1 Create `frontend/src/components/page/projects/ProjectBoard.jsx`
    - Fetch project and board data
    - Header with project name, settings link, add task button
    - TaskFilters component for filtering
    - TaskBoardView component for Kanban board
    - TaskModal rendered when task selected (via URL param)
    - _Requirements: 4.1, 7.1, 8.1_
  - [x] 9.2 Create `frontend/src/components/page/projects/TaskBoardView.jsx`
    - DragDropContext wrapper from @hello-pangea/dnd
    - Map board columns to TaskList components
    - Handle drag end events with status update
    - Optimistic updates with rollback on failure
    - Manage task state per column with pagination
    - _Requirements: 4.1, 4.2, 6.1, 6.2, 6.4, 6.5_
  - [x] 9.3 Create `frontend/src/components/page/projects/TaskList.jsx`
    - Droppable container for column
    - Column header with label and task count
    - Map tasks to TaskCard components
    - Infinite scroll / load more functionality
    - Loading skeleton during fetch
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 10. Create Task Card Component
  - [x] 10.1 Create `frontend/src/components/page/projects/TaskCard.jsx`
    - Draggable wrapper with @hello-pangea/dnd
    - Issue key badge (e.g., "HRMS-101")
    - Task type icon based on type
    - Title (truncated to 2 lines)
    - Priority badge with color coding
    - Assignee avatar (if assigned)
    - Attachment count (if attachments exist)
    - Click handler to open TaskModal via URL param
    - Visual feedback during drag
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_

- [x] 11. Create Task Filters
  - [x] 11.1 Create `frontend/src/components/page/projects/TaskFilters.jsx`
    - Search input for title filtering
    - Assignee filter dropdown
    - Priority filter dropdown
    - Type filter dropdown
    - "My Tasks" filter (assigned_to_me, reported_by_me)
    - Clear filters button
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [x] 12. Checkpoint - Board View Complete
  - Ensure board view renders with drag-drop working
  - Ask the user if questions arise

- [x] 13. Create Task Modal
  - [x] 13.1 Create `frontend/src/components/page/projects/TaskModal.jsx`
    - Fetch task details by ID
    - Editable title (EditableTitle component)
    - Editable description (TextEditor component)
    - Status selector dropdown
    - Priority selector dropdown
    - Type selector dropdown
    - Assignee selector (MemberSelector)
    - Due date picker
    - Attachments section (MediaManager)
    - TaskComments component
    - TaskActivity component
    - Close button and backdrop click handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 13.2 Create `frontend/src/components/page/projects/TaskModalSkeleton.jsx`
    - Loading skeleton matching TaskModal layout
    - _Requirements: 4.5_

- [x] 14. Create Task Form
  - [x] 14.1 Create `frontend/src/components/page/projects/TaskForm.jsx`
    - Title input (required)
    - Description textarea (optional)
    - Type selector
    - Priority selector
    - Assignee selector
    - File attachment upload
    - Submit and cancel buttons
    - Validation with Zod schema
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 15. Create Task Comments Component
  - [x] 15.1 Create `frontend/src/components/page/projects/TaskComments.jsx`
    - List of comments with author avatar, name, timestamp
    - Comment message display
    - Edit button for own comments (inline edit mode)
    - Delete button for own comments (with confirmation)
    - New comment input with TextEditor
    - Attachment support for comments
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 16. Create Task Activity Component
  - [x] 16.1 Create `frontend/src/components/page/projects/TaskActivity.jsx`
    - Timeline display of activity entries
    - Show action type, field changed, from/to values
    - Show performer avatar and name
    - Show timestamp
    - _Requirements: 8.5_

- [x] 17. Checkpoint - Task Modal Complete
  - Ensure task modal with comments and activity works
  - Ask the user if questions arise

- [x] 18. Update Sidebar Navigation
  - [x] 18.1 Update `frontend/src/components/layout/Sidebar.jsx`
    - Add "Projects" menu item with FolderKanban icon
    - Permission-gate with VIEW_PROJECT
    - Navigate to /projects on click
    - Highlight when on /projects routes
    - _Requirements: 11.1, 11.3, 11.4_

- [x] 19. Update App Routes
  - [x] 19.1 Update `frontend/src/App.jsx`
    - Add /projects route with Projects component
    - Add /projects/:projectId route with ProjectBoard component
    - Add /projects/:projectId/settings route with ProjectSettings component
    - Wrap routes with PermissionGuard for VIEW_PROJECT/UPDATE_PROJECT
    - _Requirements: 14.4_

- [x] 20. Implement Real-time Updates
  - [x] 20.1 Add WebSocket handlers for project/task updates
    - Listen for task_created, task_updated, task_deleted events
    - Update board state on socket events
    - Follow existing grievance socket patterns
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 21. Final Checkpoint
  - Ensure all components work together
  - Test full flow: create project → add tasks → drag-drop → comments
  - Verify permissions work correctly
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation follows existing patterns from grievance module
- Use existing UI components (Button, Card, Dialog, Select, Avatar, Badge, etc.)
- Follow existing service patterns (RTK Query with baseApi.injectEndpoints)
