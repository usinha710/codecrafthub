CodeCraftHub API
A lightweight Node.js + Express REST API to track learning courses. Data is persisted in a simple JSON file (courses.json) for a beginner-friendly, database-free experience.

Project overview
CodeCraftHub provides a minimal, beginner-friendly API to:

Create, read, update, and delete (CRUD) learning courses
Store course data in a JSON file (courses.json)
Validate inputs (required fields, date format, and status values)
Auto-generate unique IDs and timestamps
Features
CRUD operations for courses
Data stored in a single JSON file (no database)
Auto-generated id (starting from 1) and created_at timestamp
Required fields: name, description, target_date (YYYY-MM-DD), status
Status values: "Not Started", "In Progress", "Completed"
Robust error handling for missing fields, not-found resources, invalid statuses, and file IO errors
Auto-creates courses.json if it doesn't exist
Runs on port 5000
Installation
Prerequisites:

Node.js (v14+ recommended)
Steps:

Clone or copy the project files to your machine.
Navigate to the project root.
Install dependencies (Express is the only dependency in this setup):
npm install
Start the server:
npm start This will run the app on port 5000 by default.
Note: The package.json script is configured as:

"start": "node app.js"
How to run the application
Start the server:

npm start
The API will be available at http://localhost:5000/api
Example commands you can run with curl:

Create a new course curl -X POST -H "Content-Type: application/json"
-d '{"name":"Intro to Node.js","description":"Learn core Node.js concepts","target_date":"2026-07-31","status":"Not Started"}'
http://localhost:5000/api/courses

Get all courses curl http://localhost:5000/api/courses

Get a specific course curl http://localhost:5000/api/courses/1

Update a course by id (full replacement) curl -X PUT -H "Content-Type: application/json"
-d '{"name":"Intro to Node.js","description":"Updated desc","target_date":"2026-08-15","status":"In Progress"}'
http://localhost:5000/api/courses/1

Update a course by providing id in body (optional route) curl -X PUT -H "Content-Type: application/json"
-d '{"id":1,"name":"Intro to Node.js","description":"Updated desc","target_date":"2026-08-20","status":"Completed"}'
http://localhost:5000/api/courses

Delete a course by id curl -X DELETE http://localhost:5000/api/courses/1

Delete a course by id in the request body (optional route) curl -X DELETE -H "Content-Type: application/json"
-d '{"id":1}' http://localhost:5000/api/courses

API endpoint documentation
Base path: /api

Create a course
Endpoint: POST /api/courses
Required fields: name, description, target_date (YYYY-MM-DD), status
Status values: "Not Started", "In Progress", "Completed"
Response: 201 with the created course object
Errors:
400 for missing fields or invalid target_date/status
500 for internal server errors
Example request: { "name": "Intro to Node.js", "description": "Learn core Node.js concepts", "target_date": "2026-07-31", "status": "Not Started" }

Example response: { "id": 1, "name": "Intro to Node.js", "description": "Learn core Node.js concepts", "target_date": "2026-07-31", "status": "Not Started", "created_at": "2024-07-01T12:34:56.789Z" }

Get all courses
Endpoint: GET /api/courses
Response: 200 with an array of courses
Example response: [ { "id": 1, "name": "Intro to Node.js", "description": "Learn core Node.js concepts", "target_date": "2026-07-31", "status": "Not Started", "created_at": "2024-07-01T12:34:56.789Z" } ]

Get a specific course
Endpoint: GET /api/courses/:id
Path parameter: id (numeric)
Response: 200 with the course object
Errors:
404 if not found
400 for invalid id
Example response: { "id": 1, "name": "Intro to Node.js", "description": "Learn core Node.js concepts", "target_date": "2026-07-31", "status": "Not Started", "created_at": "2024-07-01T12:34:56.789Z" }

Update a course (full update)
Endpoint: PUT /api/courses/:id
Required fields in body: name, description, target_date, status
Response: 200 with the updated course
Errors:
400 for missing fields or invalid values
404 if not found
Example request: { "name": "Intro to Node.js", "description": "Expanded description", "target_date": "2026-08-15", "status": "In Progress" }

Update a course (update by id in body)
Endpoint: PUT /api/courses
Body must include: id, and any fields to update (name, description, target_date, status)
Response: 200 with the updated course
Errors:
400 for missing/invalid input
404 if not found
Example request: { "id": 1, "name": "Intro to Node.js", "description": "Updated desc", "target_date": "2026-08-20", "status": "Completed" }

Delete a course by id
Endpoint: DELETE /api/courses/:id
Path parameter: id
Response: 200 with { "success": true } on success
Errors:
404 if not found
400 for invalid id
Example response: { "success": true }

Delete a course (delete by id in body)
Endpoint: DELETE /api/courses
Body must include: id
Response: 200 with { "success": true } on success
Errors:
400 for missing/invalid input
404 if not found
Example request: { "id": 1 }

Data model
Course object fields:

id: number (auto-generated, starts from 1)
name: string (required)
description: string (required)
target_date: string (YYYY-MM-DD) (required)
status: string (required; one of "Not Started", "In Progress", "Completed")
created_at: string (ISO timestamp, auto-generated)
Example course JSON: { "id": 1, "name": "Intro to Node.js", "description": "Learn core Node.js concepts", "target_date": "2026-07-31", "status": "Not Started", "created_at": "2024-07-01T12:34:56.789Z" }

Error handling
Common error responses:

400 Bad Request: Missing required fields or invalid values (e.g., target_date format, invalid status)
404 Not Found: Course with the given id does not exist
500 Internal Server Error: IO issues reading/writing courses.json or unexpected server errors
The API includes descriptive error messages to help diagnose problems quickly.

Troubleshooting
Server won’t start or port is in use

Ensure no other process is using port 5000.
Check that Node.js is installed and npm dependencies are installed.
Handling missing courses.json

The app will auto-create courses.json with an empty array [] if it doesn’t exist.
JSON parse errors or corrupted data

The app will reset the data file to an empty array [] and continue serving requests. If this happens frequently, back up your data.
Date validation issues

target_date must be in YYYY-MM-DD format and a valid date (e.g., 2026-08-15).
Status validation issues

Allowed values are: Not Started, In Progress, Completed
Permissions or file write errors

Ensure the project folder is writable and the running user has permission to read/write courses.json.
If you’d like, I can tailor this README further (e.g., add a quickstart GIF, contributor guidelines, or a link to a sample repository).