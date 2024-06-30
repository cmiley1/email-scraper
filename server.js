const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5003;

require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

const fetchDependentsFromPage = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        Accept: "text/html",
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    const $ = cheerio.load(data);
    const dependents = [];

    // Parsing the dependent repositories
    $("div.Box-row").each((i, element) => {
      const repoLink = $(element)
        .find("a[data-hovercard-type='repository']")
        .attr("href");
      if (repoLink) {
        const repoPath = repoLink.split("/").slice(1, 3).join("/");
        dependents.push(repoPath);
      }
    });

    // Find the next page link
    const nextPageLink = $("a.next_page").attr("href");

    return { dependents, nextPageLink };
  } catch (error) {
    console.error("Error fetching dependents from page:", error);
    throw error;
  }
};

const fetchAllDependents = async (owner, repo) => {
  const baseUrl = `https://github.com/${owner}/${repo}/network/dependents`;
  let url = baseUrl;
  let allDependents = [];

  while (url) {
    const { dependents, nextPageLink } = await fetchDependentsFromPage(url);
    allDependents = [...allDependents, ...dependents];
    url = nextPageLink ? `https://github.com${nextPageLink}` : null;
  }

  return allDependents;
};

const fetchContributors = async (owner, repo) => {
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.error("Error fetching contributors:", error);
    throw error;
  }
};

const fetchCommitEmails = async (owner, repo, contributor) => {
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits?author=${contributor}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );
    const emails = data.map((commit) => commit.commit.author.email);
    return emails;
  } catch (error) {
    console.error("Error fetching commits:", error);
    throw error;
  }
};

const fetchPublicEmail = async (username) => {
  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );
    return data.email;
  } catch (error) {
    console.error("Error fetching user email:", error);
    throw error;
  }
};

app.use(express.json());
app.use(cors());

app.post("/fetch_dependents_emails", async (req, res) => {
  const { owner, repo } = req.body;

  try {
    const dependents = await fetchAllDependents(owner, repo);
    let allEmails = [];

    for (const dependent of dependents) {
      const [depOwner, depRepo] = dependent.split("/");
      const contributors = await fetchContributors(depOwner, depRepo);

      for (const contributor of contributors) {
        const commitEmails = await fetchCommitEmails(
          depOwner,
          depRepo,
          contributor.login
        );
        const publicEmail = await fetchPublicEmail(contributor.login);

        allEmails = [
          ...allEmails,
          ...commitEmails.map((email) => ({
            email,
            projectName: depRepo,
          })),
        ];
        if (publicEmail) {
          allEmails.push({ email: publicEmail, projectName: depRepo });
        }
      }
    }

    // Remove duplicate emails
    const uniqueEmails = Array.from(new Set(allEmails.map((e) => e.email))).map(
      (email) => {
        return allEmails.find((e) => e.email === email);
      }
    );

    // Save emails to the database
    uniqueEmails.forEach((emailObj, index) => {
      const key = `${emailObj.email}_${emailObj.projectName}_${index}`;
      setItem(key, emailObj.email, emailObj.projectName, 1); // Assuming page as 1 for simplicity
    });

    res.json({ emails: uniqueEmails });
  } catch (error) {
    console.error("Error fetching dependent repositories' emails:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch dependent repositories' emails" });
  }
});

app.get("/emails", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  getItems(offset, limit, (items) => {
    res.json({ emails: items });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
