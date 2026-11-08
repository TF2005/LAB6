// This file defines what a task looks like in MongoDB.
// MongoDB is very flexible by itself, so the Mongoose schema gives every task the same fields, types and rules.

const mongoose = require("mongoose");

// The allowed values live in two arrays so the model and the validation middleware use exactly the same lists.
// If I add a new status one day, I only change it here.
const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
  {
    // The only required field, since a task without a name means nothing. trim removes the spaces around it,
    // so a title made only of spaces is refused.
    title: {
      type: String,
      required: [true, "The title is required."],
      trim: true,
      minlength: [3, "The title must contain at least 3 characters."],
      maxlength: [100, "The title cannot be longer than 100 characters."],
    },

    // Optional free text for more details about the task.
    description: {
      type: String,
      trim: true,
      maxlength: [500, "The description cannot be longer than 500 characters."],
      default: "",
    },

    // Where the task currently stands. With enum, Mongoose refuses anything outside our list (a typo like "dnoe", for example).
    status: {
      type: String,
      enum: { values: STATUSES, message: "The status must be one of: " + STATUSES.join(", ") + "." },
      default: "todo",
    },

    // Same idea as status, but for how urgent the task is.
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: "The priority must be one of: " + PRIORITIES.join(", ") + "." },
      default: "medium",
    },

    // Optional; Mongoose turns a valid string like "2026-12-31" into a real Date.
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    // Mongoose adds createdAt and updatedAt by itself, which is handy to show the data is really saved and updated.
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

// I export the arrays with the model so validateTask.js can reuse them.
module.exports = { Task, STATUSES, PRIORITIES };