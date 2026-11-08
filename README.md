# Tasks API — Assignment 6 (REST API Project)

A RESTful API built with Node.js, Express and MongoDB (through Mongoose).
The primary resource is a task, with full CRUD: list all, get one, create, update and delete.
All data is stored in a real MongoDB database (nothing is kept only in memory).

## Project structure

```
tasks-api/
├── server.js                  # Entry point: loads .env, connects to MongoDB, starts Express
├── config/db.js               # MongoDB connection with Mongoose
├── models/Task.js             # Mongoose schema of a task
├── routes/tasks.js            # The 5 CRUD routes
├── middleware/
│   ├── validateTask.js        # Input validation for POST and PUT
│   └── errorHandler.js        # 404 handler + central error handler
├── tests/
│   ├── smoke.js               # Automated smoke test (run with npm run test:smoke)
│   └── curl_examples.md       # Example curl command for every route
├── screenshots/               # Test evidence: terminal output and MongoDB Atlas
├── .env                       # Private settings (ignored by Git)
├── .env.example               # Template of the .env file
├── .gitignore
└── package.json
```

## Requirements

- [Node.js](https://nodejs.org) 18.11 or newer (20 or newer recommended)
- MongoDB running locally (default port 27017) **or** a MongoDB Atlas connection string

## How to run the server

1. Open the project folder in VS Code (`File > Open Folder`) and open the integrated terminal.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Check the `.env` file (it is already in the zip). If it is missing, copy `.env.example` to `.env`:
   ```
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/tasks_api
   ```
   If you use MongoDB Atlas, put your Atlas connection string in `MONGODB_URI`, with the database name before the `?`:
   ```
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/tasks_api?retryWrites=true&w=majority
   ```
4. If you use a local MongoDB, make sure it is running (the `MongoDB` service on your machine, or `mongod` in another terminal).
5. Start the server:
   ```bash
   npm start
   ```
   For auto-restart while developing, use `npm run dev` (it uses `node --watch`, built into Node.js, so no extra package is needed).

You should see:
```
Connected to MongoDB.
Server running on http://localhost:3000
```

> The `.env` file is excluded from Git through `.gitignore`. It is included in the zip only so that the project runs immediately.

## The task resource

| Field         | Type   | Required | Rules                                              |
|---------------|--------|----------|----------------------------------------------------|
| `title`       | string | **yes**  | 3 to 100 characters                                |
| `description` | string | no       | up to 500 characters (default `""`)                |
| `status`      | string | no       | `todo`, `in-progress` or `done` (default `todo`)   |
| `priority`    | string | no       | `low`, `medium` or `high` (default `medium`)       |
| `dueDate`     | date   | no       | a valid date such as `2026-12-31`, or `null`       |

MongoDB adds `_id`, `createdAt`, `updatedAt` and `__v` automatically.

## Routes

| Method | Route         | Description           | Success | Possible errors |
|--------|---------------|-----------------------|---------|-----------------|
| GET    | `/tasks`      | List all tasks        | 200     | 500             |
| GET    | `/tasks/:id`  | Get one task          | 200     | 400, 404, 500   |
| POST   | `/tasks`      | Create a task         | 201     | 400, 500        |
| PUT    | `/tasks/:id`  | Replace/update a task | 200     | 400, 404, 500   |
| DELETE | `/tasks/:id`  | Delete a task         | 200     | 400, 404, 500   |

`GET /tasks` also accepts optional filters: `?status=done` and `?priority=high` (they can be combined).

### GET /tasks

Response `200 OK`:
```json
[
  {
    "_id": "6650f1c2a1b2c3d4e5f60718",
    "title": "Finish Assignment 6",
    "description": "Build the REST API",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2026-12-15T00:00:00.000Z",
    "createdAt": "2026-11-08T10:00:00.000Z",
    "updatedAt": "2026-11-08T10:00:00.000Z",
    "__v": 0
  }
]
```

### GET /tasks/:id

Response `200 OK`: a single task object (same shape as above).

Response `404 Not Found` (valid id, no such task):
```json
{ "error": "Task not found with id 000000000000000000000000" }
```

Response `400 Bad Request` (id not shaped like an ObjectId, e.g. `/tasks/abc`):
```json
{ "error": "Invalid id format: abc" }
```

### POST /tasks

Request body:
```json
{
  "title": "Finish Assignment 6",
  "description": "Build the REST API",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-12-15"
}
```

Response `201 Created`:
```json
{
  "_id": "6650f1c2a1b2c3d4e5f60718",
  "title": "Finish Assignment 6",
  "description": "Build the REST API",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-12-15T00:00:00.000Z",
  "createdAt": "2026-11-08T10:00:00.000Z",
  "updatedAt": "2026-11-08T10:00:00.000Z",
  "__v": 0
}
```

Response `400 Bad Request` (invalid input), for the body `{ "title": "", "status": "finished" }`:
```json
{
  "error": "Validation failed.",
  "details": [
    "The title is required and must be a non-empty string.",
    "The status must be one of: todo, in-progress, done."
  ]
}
```

Response `400 Bad Request` (malformed JSON):
```json
{
  "error": "Malformed JSON in the request body.",
  "details": ["Expected double-quoted property name in JSON at position 25"]
}
```
(The exact wording of the `details` message depends on the Node.js version.)

### PUT /tasks/:id

`PUT` replaces the task: send the full version. The title is required, and any optional field that is not sent goes back to its default value.

Request body:
```json
{
  "title": "Finish Assignment 6 (updated)",
  "description": "Only the README is left",
  "status": "done",
  "priority": "medium",
  "dueDate": "2026-12-10"
}
```

Response `200 OK`: the updated task.
```json
{
  "_id": "6650f1c2a1b2c3d4e5f60718",
  "title": "Finish Assignment 6 (updated)",
  "description": "Only the README is left",
  "status": "done",
  "priority": "medium",
  "dueDate": "2026-12-10T00:00:00.000Z",
  "createdAt": "2026-11-08T10:00:00.000Z",
  "updatedAt": "2026-11-08T10:30:00.000Z",
  "__v": 0
}
```

Errors: `400` for invalid data or invalid id, `404` if the task does not exist (same bodies as above).

### DELETE /tasks/:id

Response `200 OK`:
```json
{
  "message": "Task deleted successfully.",
  "task": {
    "_id": "6650f1c2a1b2c3d4e5f60718",
    "title": "Finish Assignment 6 (updated)",
    "status": "done"
  }
}
```
(The `task` object contains all the fields of the deleted task; it is shortened here.)

Errors: `400` for an invalid id, `404` if the task does not exist.

### Other errors

- Unknown URL, for example `GET /banana` → `404` `{ "error": "Route not found: GET /banana" }`
- Unexpected server problem → `500` `{ "error": "Internal server error. Please try again later." }`

## HTTP status codes used

| Code | Meaning               | When                                              |
|------|-----------------------|---------------------------------------------------|
| 200  | OK                    | Successful read, update or delete                 |
| 201  | Created               | Successful creation                               |
| 400  | Bad Request           | Invalid input, malformed JSON, invalid id         |
| 404  | Not Found             | Task or route does not exist                      |
| 500  | Internal Server Error | Unexpected error (for example the database fails) |

## How to test

### 1. Automated smoke test (main test evidence)

With the server running in one terminal (`npm start`), open a second terminal and run:

```bash
npm run test:smoke
```

The script calls every route and prints a `PASS` or `FAIL` line for each check: create, list, get one, update (and a second read to prove the change is saved), delete, and the error cases (invalid data, malformed JSON, invalid id, missing task, unknown route). A successful run ends with:

```
Result: 17 passed, 0 failed.
```

The script leaves one task in the database on purpose, so it can be seen in MongoDB.

### 2. curl examples

`tests/curl_examples.md` contains one curl command per route, with the expected status code. Replace `<ID>` with the `_id` returned by the create request.

### 3. Checking the data in the database

- **MongoDB Atlas**: open your cluster, click `Browse Collections`, then the `tasks_api` database and the `tasks` collection, and click `Refresh`.
- **MongoDB Compass (local database)**: connect to `mongodb://127.0.0.1:27017` and open the `tasks` collection of the `tasks_api` database.

### Test evidence

The `screenshots/` folder contains the smoke test output in the terminal and the task saved in the `tasks` collection of MongoDB Atlas.

## Error handling summary

- Input is validated by `middleware/validateTask.js` before it reaches the database.
- Every route uses `try/catch` and passes errors to `middleware/errorHandler.js`, so a malformed body, a bad id or a missing record never crashes the server.
- The server connects to MongoDB before listening, and prints a clear message if the connection fails.