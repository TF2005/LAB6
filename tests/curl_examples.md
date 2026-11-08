# curl examples (same requests as the Postman collection)

Start the server first with `npm start`, then run these commands in a second terminal.
On Windows, use Git Bash, because the single quotes around the JSON do not work in PowerShell. If quoting still gives you trouble, use Thunder Client or Postman instead.

Replace `<ID>` with the `_id` you get back from the create request.

```bash
# 1. Create a task (expected: 201)
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Finish Assignment 6","description":"Build the REST API","status":"in-progress","priority":"high","dueDate":"2026-12-15"}'

# 2. List all tasks (expected: 200)
curl -i http://localhost:3000/tasks

# 3. List with filters (expected: 200)
curl -i "http://localhost:3000/tasks?status=in-progress&priority=high"

# 4. Get one task (expected: 200)
curl -i http://localhost:3000/tasks/<ID>

# 5. Update a task (expected: 200)
curl -i -X PUT http://localhost:3000/tasks/<ID> \
  -H "Content-Type: application/json" \
  -d '{"title":"Finish Assignment 6 (updated)","status":"done","priority":"medium"}'

# 6. Invalid data: empty title, wrong status, bad date (expected: 400)
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"","status":"finished","dueDate":"not-a-date"}'

# 7. Broken JSON on purpose, with a trailing comma (expected: 400)
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{ "title": "Broken JSON", }'

# 8. Id that is not a valid MongoDB id (expected: 400)
curl -i http://localhost:3000/tasks/abc

# 9. Valid id format but no such task (expected: 404)
curl -i http://localhost:3000/tasks/000000000000000000000000

# 10. Delete a task (expected: 200)
curl -i -X DELETE http://localhost:3000/tasks/<ID>

# 11. Delete the same task again, it is already gone (expected: 404)
curl -i -X DELETE http://localhost:3000/tasks/<ID>

# 12. A route that does not exist (expected: 404)
curl -i http://localhost:3000/banana