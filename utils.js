// utils.js

const axios = require("axios");
const cheerio = require("cheerio");

async function getDependentRepos(owner, repo) {
  const dependentRepos = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const url = `https://github.com/${owner}/${repo}/network/dependents?page=${page}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const reposOnPage = [];
    $(".Box-row").each((index, element) => {
      const repoName = $(element)
        .find('a[href*="/network/dependents"]')
        .text()
        .trim();
      if (repoName) {
        reposOnPage.push(repoName);
      }
    });

    if (reposOnPage.length > 0) {
      dependentRepos.push(...reposOnPage);
      page++;
    } else {
      hasMorePages = false;
    }
  }

  return dependentRepos;
}

module.exports = {
  getDependentRepos,
};
