const rateLimit = require("express-rate-limit");

const createSnippetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many snippets created. Try again later." }
});

const passwordVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait 15 minutes." }
});

module.exports = {
  createSnippetLimiter,
  passwordVerifyLimiter
};
