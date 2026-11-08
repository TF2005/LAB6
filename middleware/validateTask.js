// I check the incoming data before it reaches the database, so I can answer with a clean 400 and clear messages.
// It is used on both POST and PUT, as the assignment asks.

const { STATUSES, PRIORITIES } = require("../models/Task");

function validateTask(req, res, next) {
  // No body, or a body that is not a JSON object (like an array): nothing to validate, so I stop right away.
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Invalid input.",
      details: ["The request body must be a JSON object. Remember to send the header Content-Type: application/json."],
    });
  }

  // I gather every mistake in one list, so the user can fix them all at once instead of one by one.
  const errors = [];

  // title is the only required field
  if (typeof body.title !== "string" || body.title.trim() === "") {
    errors.push("The title is required and must be a non-empty string.");
  } else if (body.title.trim().length < 3 || body.title.trim().length > 100) {
    errors.push("The title must contain between 3 and 100 characters.");
  }

  // description is optional, but if it is there it must be a string that is not too long
  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      errors.push("The description must be a string.");
    } else if (body.description.length > 500) {
      errors.push("The description cannot be longer than 500 characters.");
    }
  }

  // status must be one of our allowed values
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push("The status must be one of: " + STATUSES.join(", ") + ".");
  }

  // same idea for priority
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    errors.push("The priority must be one of: " + PRIORITIES.join(", ") + ".");
  }

  // dueDate must be a real date; null is allowed on purpose, it means "no due date anymore"
  if (body.dueDate !== undefined && body.dueDate !== null) {
    if (typeof body.dueDate !== "string" || Number.isNaN(Date.parse(body.dueDate))) {
      errors.push("The dueDate must be a valid date string, for example 2026-12-31.");
    }
  }

  // If something is wrong I answer 400 and never call next(), so nothing bad reaches the database.
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed.", details: errors });
  }

  // All good, the request can go on to the route handler.
  next();
}

module.exports = validateTask;