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
      email TEXT,
      projectName TEXT,
      page INTEGER
    )`);
  }
});

const setItem = (key, email, projectName, page) => {
  db.run(
    `INSERT OR REPLACE INTO localStorage (key, email, projectName, page) VALUES (?, ?, ?, ?)`,
    [key, email, projectName, page],
    (err) => {
      if (err) {
        console.error("Error setting item", err.message);
      }
    }
  );
};

const getItems = (offset, limit, callback) => {
  db.all(
    `SELECT email, projectName, page FROM localStorage LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        console.error("Error getting items", err.message);
        callback([]);
      } else {
        callback(rows);
      }
    }
  );
};

const resetStorage = () => {
  db.run(`DELETE FROM localStorage`, (err) => {
    if (err) {
      console.error("Error resetting storage", err.message);
    }
  });
};

module.exports = { setItem, getItems, resetStorage };
