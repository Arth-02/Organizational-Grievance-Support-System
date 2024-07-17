@echo off

rem Start the frontend application
start cmd /k "cd frontend\ && npm start"

rem Start the backend application
start cmd /k  "cd backend\ && npm start"