// I learned how to implement smoke test instead of using postman
// A quick "smoke test": this script acts like a client and calls every route of the API one after the other,
// to check that the whole chain works (Express, validation, Mongoose and the real database).

// By default it targets the local server
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

// Sends a request and returns the status code and the JSON body, so every test below stays short.
// rawBody lets me send broken JSON on purpose for the "malformed JSON" test.
async function call(method, path, body, rawBody) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (rawBody !== undefined) options.body = rawBody;
  else if (body !== undefined) options.body = JSON.stringify(body);

  const response = await fetch(BASE_URL + path, options);
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // Some answers have no JSON body, which is fine, I just keep null.
  }
  return { status: response.status, data };
}

// Prints a PASS or FAIL line for each check, so one glance at the end tells you what works.
function check(name, condition, details) {
  if (condition) {
    passed++;
    console.log("  PASS  " + name);
  } else {
    failed++;
    console.log("  FAIL  " + name + (details ? "  ->  " + details : ""));
  }
}

async function run() {
  console.log("Smoke test against " + BASE_URL + "\n");

  // First I check that the server answers at all, otherwise every test would fail with a confusing message.
  try {
    await fetch(BASE_URL + "/");
  } catch (e) {
    console.log("Cannot reach the server at " + BASE_URL + ".");
    console.log("Start it first with 'npm start' in another terminal, then run this test again.");
    process.exit(1);
  }

  // ---- 1. CREATE ----
  console.log("POST /tasks");
  const created = await call("POST", "/tasks", {
    title: "Smoke test task",
    description: "Created by tests/smoke.js to prove the API writes to the database",
    status: "todo",
    priority: "high",
    dueDate: "2026-12-31",
  });
  check("returns 201 Created", created.status === 201, "got " + created.status);
  check("returns the new task with an _id", !!(created.data && created.data._id));
  const id = created.data && created.data._id;

  // Without an id the next tests are pointless, so I stop here instead of printing a pile of useless failures.
  if (!id) {
    console.log("\nCannot continue without a created task. Check the server terminal for the error.");
    process.exit(1);
  }

  // ---- 2. LIST ALL ----
  console.log("GET /tasks");
  const list = await call("GET", "/tasks");
  check("returns 200 OK", list.status === 200, "got " + list.status);
  check("the list contains the new task", Array.isArray(list.data) && list.data.some((t) => t._id === id));

  // ---- 3. GET ONE ----
  console.log("GET /tasks/:id");
  const one = await call("GET", "/tasks/" + id);
  check("returns 200 OK", one.status === 200, "got " + one.status);
  check("returns the right title", one.data && one.data.title === "Smoke test task");

  // ---- 4. UPDATE ----
  console.log("PUT /tasks/:id");
  const updated = await call("PUT", "/tasks/" + id, {
    title: "Smoke test task (updated)",
    description: "Updated by the smoke test",
    status: "done",
    priority: "medium",
  });
  check("returns 200 OK", updated.status === 200, "got " + updated.status);
  check("the status is now done", updated.data && updated.data.status === "done");

  // I read the task again to prove the change was really saved in the database, not just sent back in the answer.
  const reread = await call("GET", "/tasks/" + id);
  check("the update is persisted", reread.data && reread.data.title === "Smoke test task (updated)");

  // ---- 5. ERROR CASES ----
  console.log("Error handling");
  const invalid = await call("POST", "/tasks", { title: "", status: "finished", dueDate: "not-a-date" });
  check("invalid data returns 400", invalid.status === 400, "got " + invalid.status);
  check("the 400 body lists the problems", invalid.data && Array.isArray(invalid.data.details));

  const malformed = await call("POST", "/tasks", undefined, '{ "title": "Broken JSON", }');
  check("malformed JSON returns 400", malformed.status === 400, "got " + malformed.status);

  const badId = await call("GET", "/tasks/abc");
  check("invalid id format returns 400", badId.status === 400, "got " + badId.status);

  const missing = await call("GET", "/tasks/000000000000000000000000");
  check("missing task returns 404", missing.status === 404, "got " + missing.status);

  const unknownRoute = await call("GET", "/banana");
  check("unknown route returns 404", unknownRoute.status === 404, "got " + unknownRoute.status);

  // ---- 6. DELETE ----
  // I delete a second, temporary task so the first one stays in the database and you can see it in Atlas.
  console.log("DELETE /tasks/:id");
  const temp = await call("POST", "/tasks", { title: "Temporary task to delete" });
  const tempId = temp.data && temp.data._id;
  const deleted = await call("DELETE", "/tasks/" + tempId);
  check("returns 200 OK", deleted.status === 200, "got " + deleted.status);
  const deletedAgain = await call("DELETE", "/tasks/" + tempId);
  check("deleting it again returns 404", deletedAgain.status === 404, "got " + deletedAgain.status);

  console.log("\nResult: " + passed + " passed, " + failed + " failed.");
  console.log('The task "Smoke test task (updated)" (id ' + id + ") was left in the database as visible proof.");

  // A non-zero exit code tells the terminal that something went wrong.
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("The smoke test crashed:", err);
  process.exit(1);
});