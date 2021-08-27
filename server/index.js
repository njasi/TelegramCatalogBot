if (
  process.env.NODE_ENV == "production" ||
  process.env.NODE_ENV == "production_test"
) {
  require("dotenv").config({ path: ".env_deploy" });
  console.log("Deploy mode");
} else {
  require("dotenv").config({ path: ".env_test" });
  console.log("Develop mode");
}

const path = require("path");
const express = require("express");
const morgan = require("morgan");
const compression = require("compression");

const db = require("./db");
const PORT = process.env.PORT || 8080;
const app = express();

module.exports = app;

const createApp = () => {
  // logging middleware
  app.use(morgan("dev"));

  // body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // compression middleware
  app.use(compression());

  // auth and api routes
  // TODO: add auth route
  // app.use("/auth", require("./auth"));
  app.use("/api", require("./api"));
  app.use("/", require("./static"));

  // any remaining requests with an extension (.js, .css, etc.) send 404
  app.use((req, res, next) => {
    if (path.extname(req.path).length) {
      const err = new Error("Not found");
      err.status = 404;
      next(err);
    } else {
      next();
    }
  });

  // TODO: serve index.html
  // app.use("*", (req, res) => {
  //   res.sendFile(path.join(__dirname, "..", "public/index.html"));
  // });

  // error handling endware
  app.use((err, req, res, next) => {
    if (!err.fake) {
      console.error(err.stack);
    }
    console.log(err);
    res.status(err.status || 500).send(err.message || "Internal server error.");
  });
};

const startListening = () => {
  // start listening (and create a 'server' object representing our server)
  const server = app.listen(PORT, () =>
    console.log(`Started listening on ${PORT}`)
  );
};

const syncDb = (force = false) =>
  db
    .sync({ force })
    .then(function () {})
    .catch(function (err) {
      console.log("Error:", err);
    });

async function bootApp() {
  // await db.sync({ force: true });
  await syncDb();
  await createApp();
  await startListening();
}

// for if I ever write tests lol
if (require.main == module) {
  bootApp().catch((e) => console.log(e));
} else {
  createApp();
}
