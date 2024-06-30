import React, { useState } from "react";
import axios from "axios";
import DependentList from "./components/DependentList";

function App() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);

  const fetchEmails = async () => {
    try {
      console.log("Sending request to fetch emails:", { owner, repo });
      const response = await axios.post(
        "http://localhost:5003/fetch_dependents_emails",
        { owner, repo }
      );
      console.log("Received response:", response);

      if (response.data) {
        console.log("Response data:", response.data);
        setEmails(response.data.emails || []);
      } else {
        console.warn("No data in response:", response);
        setEmails([]);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching emails:", error);
      setError(error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchEmails();
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
      <DependentList emails={emails} />
    </div>
  );
}

export default App;
