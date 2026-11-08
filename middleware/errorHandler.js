//The safety net of the app: whatever goes wrong in a route ends up here,
// so the server sends a clean JSON answer instead of crashing.

// Runs only when no route matched the URL (for example GET /banana), so it must stay after all the real routes in server.js.
function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found: " + req.method + " " + req.originalUrl });
}

// Express knows this is an error handler because it has four parameters, even though "next" is never used.
function errorHandler(err, req, res, next) {
  // The client sent broken JSON (a missing quote, a trailing comma...), so it is a 400, not our fault.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in the request body.", details: [err.message] });
  }

  // The id in the URL does not look like a MongoDB ObjectId (like /tasks/abc), which Mongoose reports as a CastError.
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid id format: " + err.value });
  }

  // A Mongoose validation error that got past our own middleware; unlikely, but a good second safety.
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed.", details });
  }

  // Anything else is unexpected, so I log it in the terminal for myself but send a generic message to the client.
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal server error. Please try again later." });
}

module.exports = { notFoundHandler, errorHandler };