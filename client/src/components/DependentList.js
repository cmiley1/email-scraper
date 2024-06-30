import React from "react";

const DependentList = ({ emails }) => {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Email Address</th>
            <th>Dependent Repo Name</th>
            <th>Page Number</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email, index) => (
            <tr key={index}>
              <td>{email.email}</td>
              <td>{email.projectName}</td>
              <td>{email.page}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DependentList;
