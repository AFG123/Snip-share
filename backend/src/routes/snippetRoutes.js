const express = require("express");
const {
  createSnippetHandler,
  getSnippetHandler,
  getRawSnippetHandler,
  verifySnippetHandler,
  getManageSnippetHandler,
  deleteManageSnippetHandler
} = require("../controllers/snippetController");

const router = express.Router();

router.post("/", createSnippetHandler);
router.post("/:shortId/verify", verifySnippetHandler);
router.get("/manage/:token", getManageSnippetHandler);
router.delete("/manage/:token", deleteManageSnippetHandler);
router.get("/:shortId", getSnippetHandler);
router.get("/:shortId/raw", getRawSnippetHandler);

module.exports = router;
