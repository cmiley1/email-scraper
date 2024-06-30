import React, { useEffect, useState } from "react";
import axios from "axios";
import DependentList from "./components/DependentList";

function App() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmails = async (page = 1) => {
    try {
      const response = await axios.get(
        `http://localhost:5003/emails?page=${page}&limit=10`
      );
      setEmails(response.data.emails);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (error) {
      console.error("Error fetching emails:", error);
      setError(error);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchDependentEmails = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5003/fetch_dependents_emails",
        { owner, repo }
      );
      setEmails(response.data.emails);
      setError(null);
    } catch (error) {
      console.error("Error fetching dependent emails:", error);
      setError(error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDependentEmails();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchEmails(newPage);
  };

  return (
    <div>
      <h1>Fetch Emails from Dependent Repositories</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Owner:
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Repo:
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Run</button>
      </form>
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
      <h2>Emails</h2>
      <DependentList emails={emails} />
      <div>
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
