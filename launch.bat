@echo off

rem Start the frontend application
start cmd /k "cd frontend\ && npm run dev"

rem Start the backend application
start cmd /k  "cd backend\ && npm start"

rem Open VS Code in the current directory
start cmd /k "code ."