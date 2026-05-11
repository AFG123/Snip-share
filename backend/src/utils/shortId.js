const crypto = require("crypto");

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomAlphanum(length) {
  const bytes = crypto.randomBytes(length);
  let value = "";

  for (let i = 0; i < length; i += 1) {
    value += ALPHANUM[bytes[i] % ALPHANUM.length];
  }

  return value;
}

function generateShortId(length = 6) {
  return generateRandomAlphanum(length);
}

function generateManageToken(length = 32) {
  return generateRandomAlphanum(length);
}

module.exports = { generateShortId, generateManageToken };
