/**
 * register the many api routes here lol
 */

const router = require("express").Router();
module.exports = router;

/**
 * subrouters
 */
router.use("/bot", require("./bot"));

/**
 * api/update
 */
router.get(`/update`, (req, res, next) => {
  try {
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
});

/**
 * when requesting a route that does not exist
 */
router.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
