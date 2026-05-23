const { pool } = require("./db");
const bcrypt = require("bcrypt");
const { generateShortId, generateManageToken } = require("../utils/shortId");

async function createSnippet({
  content,
  language,
  title,
  note,
  expiryHours,
  expiry,
  password,
  burnAfterRead = false,
  downloadEnabled = true
}) {
  const resolvedExpiryHours = typeof expiryHours === "number" && Number.isFinite(expiryHours) ? expiryHours : (typeof expiry === "number" && Number.isFinite(expiry) ? expiry : null);
  const expiryAt = resolvedExpiryHours !== null ? new Date(Date.now() + resolvedExpiryHours * 60 * 60 * 1000) : null;
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shortId = generateShortId(6);
    const manageToken = generateManageToken(32);

    try {
      await pool.query(
        `INSERT INTO snippets (short_id, manage_token, content, language, title, note, expiry_at, password_hash, burn_after_read, download_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [shortId, manageToken, content, language, title || null, note || null, expiryAt, passwordHash, burnAfterRead, downloadEnabled]
      );

      return { shortId, manageToken };
    } catch (err) {
      if (err.code !== "23505") {
        throw err;
      }
    }
  }

  throw new Error("Failed to generate a unique short ID");
}

async function getSnippetByShortId(shortId) {
  const result = await pool.query(
    `SELECT short_id, content, language, title, note, created_at, expiry_at, password_hash, burn_after_read, download_enabled
     FROM snippets
     WHERE short_id = $1`,
    [shortId]
  );

  return result.rows[0] || null;
}

async function incrementViewCountByShortId(shortId) {
  await pool.query(
    `UPDATE snippets
     SET view_count = view_count + 1
     WHERE short_id = $1`,
    [shortId]
  );
}

async function getSnippetByManageToken(token) {
  const result = await pool.query(
    `SELECT short_id, content, created_at, expiry_at, view_count
     FROM snippets
     WHERE manage_token = $1`,
    [token]
  );

  return result.rows[0] || null;
}

async function deleteSnippetByManageToken(token) {
  const result = await pool.query(
    `DELETE FROM snippets
     WHERE manage_token = $1
     RETURNING short_id`,
    [token]
  );

  return result.rows[0] || null;
}

async function ensureDestroyedSnippetsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS destroyed_snippets (
      short_id VARCHAR(6) PRIMARY KEY,
      destroyed_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function destroySnippetByShortId(shortId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO destroyed_snippets (short_id)
       VALUES ($1)
       ON CONFLICT (short_id) DO UPDATE SET destroyed_at = NOW()`,
      [shortId]
    );
    await client.query("DELETE FROM snippets WHERE short_id = $1", [shortId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function isSnippetDestroyed(shortId) {
  await ensureDestroyedSnippetsTable();
  const result = await pool.query(
    `SELECT 1 FROM destroyed_snippets WHERE short_id = $1`,
    [shortId]
  );

  return result.rowCount > 0;
}

function isExpired(snippet) {
  return Boolean(snippet.expiry_at && new Date(snippet.expiry_at) <= new Date());
}

async function verifySnippetPassword(password, passwordHash) {
  if (!passwordHash) {
    return true;
  }

  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  createSnippet,
  getSnippetByShortId,
  incrementViewCountByShortId,
  getSnippetByManageToken,
  deleteSnippetByManageToken,
  isExpired,
  verifySnippetPassword,
  ensureDestroyedSnippetsTable,
  destroySnippetByShortId,
  isSnippetDestroyed
};
