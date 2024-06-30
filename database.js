const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    db.run(`CREATE TABLE IF NOT EXISTS localStorage (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);
  }
});

const setItem = (key, value) => {
  db.run(
    `INSERT OR REPLACE INTO localStorage (key, value) VALUES (?, ?)`,
    [key, value],
    (err) => {
      if (err) {
        console.error("Error setting item", err.message);
      }
    }
  );
};

const getItem = (key, callback) => {
  db.get(`SELECT value FROM localStorage WHERE key = ?`, [key], (err, row) => {
    if (err) {
      console.error("Error getting item", err.message);
      callback(null);
    } else {
      callback(row ? row.value : null);
    }
  });
};

const resetStorage = () => {
  db.run(`DELETE FROM localStorage`, (err) => {
    if (err) {
      console.error("Error resetting storage", err.message);
    }
  });
};

module.exports = { setItem, getItem, resetStorage };
