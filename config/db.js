// This file only handles the connection to MongoDB through Mongoose.
// I kept it separate from server.js so that, if the database settings change one day, this is the only file I need to open.

const mongoose = require("mongoose");

// The connection string comes in as a parameter (it is read from the .env file in server.js), so this file stays simple and reusable.
async function connectDB(uri) {
  // If MongoDB is not reachable, I want to know after 5 seconds, not after a long silent wait.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  console.log("Connected to MongoDB.");
}

// I do not catch the error here on purpose: it goes back to server.js, which prints a clear message and stops the app.
module.exports = connectDB;