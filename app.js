// app.js
// Simple Node.js + Express REST API for CodeCraftHub-like course tracking
// - Data persisted in a JSON file: courses.json (auto-created if missing)
// - CRUD endpoints under /api/courses
// - Each course: id, name, description, target_date (YYYY-MM-DD), status, created_at
// - Valid statuses: "Not Started", "In Progress", "Completed"

'use strict';

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Initialize Express app
const app = express();
app.use(express.json()); // Built-in middleware to parse JSON bodies

// Configuration
const PORT = 5000;
const DATA_FILE = path.resolve(__dirname, 'courses.json'); // JSON file to store courses

// Allowed statuses for validation
const ALLOWED_STATUSES = new Set(['Not Started', 'In Progress', 'Completed']);

// Utility: ensure the data file exists (creates with [] if missing)
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    // If file doesn't exist, create it with an empty array
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
  }
}

// Utility: read all courses from the JSON file
async function readAllCourses() {
  await ensureDataFile();
  try {
    const text = await fs.readFile(DATA_FILE, 'utf8');
    // If file is empty or invalid, reset to []
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    return data;
  } catch (err) {
    // In case of parse error or unexpected format, reset to []
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
    return [];
  }
}

// Utility: write all courses to the JSON file
async function writeAllCourses(courses) {
  await ensureDataFile();
  const text = JSON.stringify(courses, null, 2);
  await fs.writeFile(DATA_FILE, text, 'utf8');
}

// Utility: validate target_date in YYYY-MM-DD format
function isValidDateYYYYMMDD(dateStr) {
  if (typeof dateStr !== 'string') return false;
  // Basic format check
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  // Validate using Date object (ensures valid calendar date)
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  // Ensure that the date components match (prevents 2020-02-31 from passing)
  const [y, m, day] = dateStr.split('-').map(Number);
  return (
    d.getUTCFullYear() === y &&
    d.getUTCMonth() + 1 === m &&
    d.getUTCDate() === day
  );
}

// Utility: compute next auto-incremented id
function getNextId(courses) {
  if (!courses || courses.length === 0) return 1;
  const maxId = Math.max(...courses.map((c) => c.id));
  return maxId + 1;
}

// Start the API server after ensuring the data file exists
async function startServer() {
  // Pre-create the data file if it doesn't exist
  await ensureDataFile();

  // Create a router for API endpoints
  const apiRouter = express.Router();

  // POST /api/courses - Add a new course
  apiRouter.post('/courses', async (req, res) => {
    try {
      const { name, description, target_date, status } = req.body;

      // Validate required fields
      if (!name || !description || !target_date || !status) {
        return res.status(400).json({ error: 'Missing required fields: name, description, target_date, status' });
      }

      // Validate target_date format
      if (!isValidDateYYYYMMDD(target_date)) {
        return res.status(400).json({ error: 'target_date must be in format YYYY-MM-DD' });
      }

      // Validate status
      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${Array.from(ALLOWED_STATUSES).join(', ')}` });
      }

      // Load existing courses to compute id
      const courses = await readAllCourses();
      const id = getNextId(courses);
      const created_at = new Date().toISOString();

      const newCourse = {
        id,
        name,
        description,
        target_date,
        status,
        created_at
      };

      courses.push(newCourse);
      await writeAllCourses(courses);

      return res.status(201).json(newCourse);
    } catch (err) {
      console.error('Error in POST /api/courses:', err);
      return res.status(500).json({ error: 'Internal server error while creating course' });
    }
  });

  // GET /api/courses - Get all courses
  apiRouter.get('/courses', async (req, res) => {
    try {
      const courses = await readAllCourses();
      return res.json(courses);
    } catch (err) {
      console.error('Error in GET /api/courses:', err);
      return res.status(500).json({ error: 'Internal server error while reading courses' });
    }
  });

  // GET /api/courses/:id - Get a specific course by id
  apiRouter.get('/courses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid course id' });
      }

      const courses = await readAllCourses();
      const course = courses.find((c) => c.id === id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      return res.json(course);
    } catch (err) {
      console.error('Error in GET /api/courses/:id:', err);
      return res.status(500).json({ error: 'Internal server error while reading course' });
    }
  });

  // PUT /api/courses/:id - Update a course (full replacement)
  apiRouter.put('/courses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid course id' });
      }

      const { name, description, target_date, status } = req.body;

      // Validate required fields for full update
      if (!name || !description || !target_date || !status) {
        return res.status(400).json({ error: 'Missing required fields for update: name, description, target_date, status' });
      }

      if (!isValidDateYYYYMMDD(target_date)) {
        return res.status(400).json({ error: 'target_date must be in format YYYY-MM-DD' });
      }

      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${Array.from(ALLOWED_STATUSES).join(', ')}` });
      }

      const courses = await readAllCourses();
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Preserve created_at; update other fields
      const updated = {
        ...courses[idx],
        name,
        description,
        target_date,
        status
      };

      courses[idx] = updated;
      await writeAllCourses(courses);

      return res.json(updated);
    } catch (err) {
      console.error('Error in PUT /api/courses/:id:', err);
      return res.status(500).json({ error: 'Internal server error while updating course' });
    }
  });

  // PUT /api/courses - Optional: Update a course by providing id in body
  apiRouter.put('/courses', async (req, res) => {
    try {
      const { id, name, description, target_date, status } = req.body;

      if (typeof id !== 'number') {
        return res.status(400).json({ error: 'Missing or invalid id in request body' });
      }

      if (!name || !description || !target_date || !status) {
        return res.status(400).json({ error: 'Missing required fields for update: name, description, target_date, status' });
      }

      if (!isValidDateYYYYMMDD(target_date)) {
        return res.status(400).json({ error: 'target_date must be in format YYYY-MM-DD' });
      }

      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${Array.from(ALLOWED_STATUSES).join(', ')}` });
      }

      const courses = await readAllCourses();
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const updated = {
        ...courses[idx],
        name,
        description,
        target_date,
        status
      };

      courses[idx] = updated;
      await writeAllCourses(courses);

      return res.json(updated);
    } catch (err) {
      console.error('Error in PUT /api/courses (body id):', err);
      return res.status(500).json({ error: 'Internal server error while updating course' });
    }
  });

  // DELETE /api/courses/:id - Delete a course
  apiRouter.delete('/courses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid course id' });
      }

      const courses = await readAllCourses();
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Course not found' });
      }

      courses.splice(idx, 1);
      await writeAllCourses(courses);

      return res.json({ success: true });
    } catch (err) {
      console.error('Error in DELETE /api/courses/:id:', err);
      return res.status(500).json({ error: 'Internal server error while deleting course' });
    }
  });

  // DELETE /api/courses - Optional: Delete by id provided in body
  apiRouter.delete('/courses', async (req, res) => {
    try {
      const { id } = req.body;
      if (typeof id !== 'number') {
        return res.status(400).json({ error: 'Missing or invalid id in request body' });
      }

      const courses = await readAllCourses();
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Course not found' });
      }

      courses.splice(idx, 1);
      await writeAllCourses(courses);

      return res.json({ success: true });
    } catch (err) {
      console.error('Error in DELETE /api/courses (body id):', err);
      return res.status(500).json({ error: 'Internal server error while deleting course' });
    }
  });

  // Mount the API router under /api
  app.use('/api', apiRouter);

  // Basic root message to verify server is running
  app.get('/', (req, res) => {
    res.send('CodeCraftHub API is running. Use /api/courses endpoints.');
  });

  // Start listening
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Start the server (with data file initialization)
startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});