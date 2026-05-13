const express = require("express");
const {
  createSnippetHandler,
  getSnippetHandler,
  getRawSnippetHandler,
  verifySnippetHandler,
  getManageSnippetHandler,
  deleteManageSnippetHandler
} = require("../controllers/snippetController");
const {
  createSnippetLimiter,
  passwordVerifyLimiter
} = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/", createSnippetLimiter, createSnippetHandler);
router.post("/:shortId/verify", passwordVerifyLimiter, verifySnippetHandler);
router.get("/manage/:token", getManageSnippetHandler);
router.delete("/manage/:token", deleteManageSnippetHandler);
router.get("/:shortId", getSnippetHandler);
router.get("/:shortId/raw", getRawSnippetHandler);

module.exports = router;
