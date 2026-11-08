// The five CRUD routes for tasks. server.js mounts this router on "/tasks", so router.get("/") here means GET /tasks
// and router.get("/:id") means GET /tasks/:id.

const express = require("express");
const { Task } = require("../models/Task");
const validateTask = require("../middleware/validateTask");

const router = express.Router();

// I pick the allowed fields by hand instead of passing req.body straight to the database,
// so nobody can sneak in things like "_id" or "createdAt" that only the server should control.
function pickTaskFields(body) {
  return {
    title: body.title,
    description: body.description,
    status: body.status,
    priority: body.priority,
    dueDate: body.dueDate,
  };
}

// GET /tasks  ->  list all tasks
// I added optional filters (?status=done and ?priority=high) because it feels closer to a real API; with no filter, everything is returned.
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    // Newest first, so the order is always predictable.
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    // An empty list is still a valid answer, so it is a 200 too.
    res.status(200).json(tasks);
  } catch (err) {
    // Any unexpected problem goes to the central error handler, so the server answers with a 500 instead of crashing.
    next(err);
  }
});

// GET /tasks/:id  ->  get one task
router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    // Right id format but nothing in the database: this is the "missing record" case, so 404.
    if (!task) {
      return res.status(404).json({ error: "Task not found with id " + req.params.id });
    }

    res.status(200).json(task);
  } catch (err) {
    // A badly shaped id throws a CastError here, which the error handler turns into a 400.
    next(err);
  }
});

// POST /tasks  ->  create a task
// validateTask runs first, and the request only reaches the code below if the data is valid.
router.post("/", validateTask, async (req, res, next) => {
  try {
    const task = await Task.create(pickTaskFields(req.body));

    // 201 means something new was created, and I send the saved task back so the client gets its new id.
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id  ->  update a task
// PUT means "replace the task with what I send", so the title is required here too,
// and any optional field that is missing goes back to its default value.
router.put("/:id", validateTask, async (req, res, next) => {
  try {
    const fields = pickTaskFields(req.body);

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title: fields.title,
        description: fields.description !== undefined ? fields.description : "",
        status: fields.status !== undefined ? fields.status : "todo",
        priority: fields.priority !== undefined ? fields.priority : "medium",
        dueDate: fields.dueDate !== undefined ? fields.dueDate : null,
      },
      {
        // Without new: true, Mongoose would send back the task as it was before the update.
        new: true,
        // Mongoose skips the schema rules on updates by default, so I turn them on.
        runValidators: true,
      }
    );

    // Nothing found with that id means nothing to update, so 404.
    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found with id " + req.params.id });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});
// DELETE /tasks/:id  ->  delete a task
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found with id " + req.params.id });
    }

    // I answer 200 with the deleted task instead of an empty 204, because it is nicer to see what was removed when testing.
    res.status(200).json({ message: "Task deleted successfully.", task: deletedTask });
  } catch (err) {
    next(err);
  }
});

module.exports = router;