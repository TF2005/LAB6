// The entry point of the project: this is the file Node runs with "npm start".
// It reads the .env settings, connects to MongoDB, plugs everything together and starts listening for requests.

// dotenv goes first, because it copies the lines of the .env file (PORT, MONGODB_URI) into process.env
// before anything else tries to read them, and it keeps secrets out of the code.
require("dotenv").config();

const express = require("express");

const connectDB = require("./config/db");
const taskRoutes = require("./routes/tasks");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// If the .env file is missing, I fall back on default values so the project still starts for whoever opens it.
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tasks_api";

// Turns a JSON request body into a JavaScript object (req.body); without this line, req.body would be undefined.
app.use(express.json());

// A small welcome route, so opening http://localhost:3000 in a browser shows something useful instead of an error.
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Tasks API.",
    resource: "/tasks",
    documentation: "See the README.md file for every available route.",
  });
});

// Every request starting with /tasks is handled by routes/tasks.js (the five CRUD routes).
app.use("/tasks", taskRoutes);

// The order matters: these two must come after all the real routes.
// The first catches unknown URLs (404), the second catches every error passed with next(err).
app.use(notFoundHandler);
app.use(errorHandler);

// I connect to the database first and only start the server if it works, so we never accept requests we cannot answer.
async function start() {
  try {
    await connectDB(MONGODB_URI);

    app.listen(PORT, () => {
      console.log("Server running on http://localhost:" + PORT);
    });
  } catch (err) {
    // If MongoDB cannot be reached, I explain it clearly in the terminal and stop the app.
    console.error("Could not connect to MongoDB: " + err.message);
    console.error("Please make sure MongoDB is running, or check the MONGODB_URI value in your .env file.");
    process.exit(1);
  }
}

// If a promise fails and nobody caught it, I just log it, so one forgotten error cannot take the API down during a demo.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

start();