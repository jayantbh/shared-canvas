const fetch = require("node-fetch");
const express = require("express");
const path = require("path");
const knex = require("knex");

const knexfile = require("../knexfile");
const app = express();

const port = process.env.port || 3000;

app.set("view engine", "html");
app.engine("html", require("hbs").__express);
app.set("views", __dirname + "/dist");

app.get("/", async (req, res) => {
  const status = await fetch(`http://localhost:${port}/status`).then(
    (r) => r.status
  );
  res.render("index", { status });
});

app.get("/status", (req, res) => {
  res.sendStatus(200);
});

/**
 * @type {Knex}
 */
const database = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "your_database_user",
    password: "your_database_password",
    database: "myapp_test",
  },
});

app.use(express.static("dist"));

app.listen(port, "0.0.0.0", () => {
  console.log(`[Express + Parcel] App listening at http://localhost:${port}`);
});
