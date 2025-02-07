# Email Scraper

![Email Scraper Interface](https://raw.githubusercontent.com/cmiley1/email-scraper/master/public/example.png)

A tool for retrieving GitHub users' email addresses from repository dependencies.

## Prerequisites

Before you begin, ensure you have:
- Node.js installed
- npm (Node Package Manager) installed
- A GitHub personal access token

## Setup

1. Clone the repository

2. npm install

3. Create a `.env` file in the root directory:

Replace `your_github_token_here` with your GitHub personal access token.



## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5003

## Project Structure

- `/client` - React frontend application
- `server.js` - Express backend server
- `database.js` - SQLite database configuration
- `utils.js` - Utility functions for GitHub API interactions

## Technologies Used

- Frontend: React
- Backend: Node.js, Express
- Database: SQLite
- APIs: GitHub API
