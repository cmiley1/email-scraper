const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const app = express();
const PORT = 5003;

require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.use(express.json());

// Configure CORS options
const corsOptions = {
  origin: "http://localhost:3000", // Allow requests from this origin
  methods: ["GET", "POST", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"], // Allow these methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

const fetchDependentsFromPage = async (url) => {
  try {
    console.log(`Fetching dependents from: ${url}`);
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

    console.log(`Found dependents: ${dependents.join(", ")}`);

    // Find the next page link
    const nextPageLink = $("a.next_page").attr("href");
    console.log(`Next page link: ${nextPageLink}`);

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

  console.log(`All dependents: ${allDependents.join(", ")}`);
  return allDependents;
};

const fetchContributors = async (owner, repo) => {
  try {
    console.log(`Fetching contributors for: ${owner}/${repo}`);
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
    console.log(
      `Fetching commits for: ${owner}/${repo}, contributor: ${contributor}`
    );
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
    console.log(`Fetching public email for user: ${username}`);
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

        allEmails = [...allEmails, ...commitEmails];
        if (publicEmail) {
          allEmails.push(publicEmail);
        }
      }
    }

    res.json({ emails: [...new Set(allEmails)] });
  } catch (error) {
    console.error("Error fetching dependent repositories' emails:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch dependent repositories' emails" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
