import React, { useEffect, useState } from "react";
import cheerio from "cheerio";

const parseHTML = (html) => {
  const $ = cheerio.load(html);
  const dependents = [];

  $(".Box-row").each((index, element) => {
    const username = $(element).find(".avatar-user").attr("alt").substring(1);
    const avatar = $(element).find(".avatar-user").attr("src");
    const repoName = $(element).find("a.text-bold").text();
    const repoLink = $(element).find("a.text-bold").attr("href");

    dependents.push({ username, avatar, repoName, repoLink });
  });

  return dependents;
};

const DependentList = () => {
  const [dependents, setDependents] = useState([]);

  useEffect(() => {
    const fetchHTML = async () => {
      // Fetch or use your HTML string here
      const html = `your_html_here`; // Replace with your HTML string
      const parsedData = parseHTML(html);
      setDependents(parsedData);
    };

    fetchHTML();
  }, []);

  return (
    <div>
      {dependents.map((dependent, index) => (
        <div
          className="Box-row d-flex flex-items-center"
          key={index}
          data-test-id="dg-repo-pkg-dependent"
        >
          <img
            className="avatar mr-2 avatar-user"
            src={dependent.avatar}
            width="20"
            height="20"
            alt={`@${dependent.username}`}
          />
          <span
            className="f5 color-fg-muted"
            data-repository-hovercards-enabled=""
          >
            <a
              data-hovercard-type="user"
              data-hovercard-url={`/users/${dependent.username}/hovercard`}
              data-octo-click="hovercard-link-click"
              data-octo-dimensions="link_type:self"
              href={`/${dependent.username}`}
            >
              {dependent.username}
            </a>{" "}
            /
            <a
              className="text-bold"
              data-hovercard-type="repository"
              data-hovercard-url={`${dependent.repoLink}/hovercard`}
              href={dependent.repoLink}
            >
              {dependent.repoName}
            </a>
          </span>
          <div className="d-flex flex-auto flex-justify-end">
            <span className="color-fg-muted text-bold pl-3">
              <svg
                aria-hidden="true"
                height="16"
                viewBox="0 0 16 16"
                version="1.1"
                width="16"
                data-view-component="true"
                className="octicon octicon-star"
              >
                <path d="M8 .25L6.6 5.6 1 5.8l4.5 3.4-1.6 5 4.1-3 4.1 3-1.6-5 4.5-3.4-5.6-.2L8 .25z"></path>
              </svg>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DependentList;
