# TaskFlow

TaskFlow is a workspace-based task management and lightweight CRM application.
It combines Kanban project planning with lead tracking, workspace roles, member
invites, task comments, and activity history.

The project is split into two applications:

- `api` - Express, TypeScript, Prisma, PostgreSQL
- `web` - React, TypeScript, Vite, React Router

## Why This Project

TaskFlow is built as a full-stack productivity product rather than a simple CRUD
demo. The main goal is to model a realistic team workflow where users can create
workspaces, invite members, manage projects, move tasks through columns, track
leads, and connect CRM follow-ups to actual work items.

## Features

- Authentication with register, login, logout, refresh token, forgot password,
  reset password, and change password flows
- Access token plus HTTP-only refresh token flow
- Workspace management with member roles: `owner`, `admin`, `member`, `viewer`
- Email-based workspace invitations
- Project, column, and task management
- Kanban-style task ordering and task assignment
- Task archive and restore flow
- Nested task comments and replies
- Lead management with stages: `new`, `contacted`, `qualified`, `won`, `lost`
- Link and unlink leads with tasks
- Create follow-up tasks directly from leads
- Activity logging for important workspace actions
- OpenAPI/Swagger documentation
- Request validation with Zod
- Soft delete support for core entities

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Zod
- Tailwind CSS
- dnd-kit

### Backend

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- Prisma 7
- Zod
- JWT
- bcrypt
- Nodemailer
- Pino logger
- Swagger UI / OpenAPI

## Project Structure

```text
TaskFlow/
|-- api/
|   |-- prisma/
|   |   |-- migrations/
|   |   `-- schema.prisma
|   `-- src/
|       |-- common/
|       |-- config/
|       |-- db/
|       |-- docs/
|       |-- jobs/
|       |-- modules/
|       `-- server.ts
`-- web/
    `-- src/
        |-- app/
        |-- components/
        |-- features/
        `-- pages/
```

## Architecture Overview

```mermaid
flowchart LR
  User[User] --> Web[React + Vite Web App]
  Web --> API[Express API]
  API --> DB[(PostgreSQL)]
  API --> Mail[SMTP Email Service]
  API --> Docs[OpenAPI / Swagger]
```

The frontend calls the API through a configured `VITE_API_URL`. The backend owns
authentication, authorization, validation, business rules, database access, and
OpenAPI documentation.

## Authentication Flow

TaskFlow uses a short-lived access token and a refresh token cookie.

- The API returns an access token after login or registration.
- The refresh token is stored in an HTTP-only cookie.
- The web app attaches the access token as a Bearer token.
- When the access token expires, the web app calls the refresh endpoint.
- Refresh/logout requests use CSRF protection because they rely on cookies.
- Refresh tokens are stored hashed in the database and rotated on refresh.

## Local Development

### Prerequisites

- Node.js 22+
- npm
- PostgreSQL

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TaskFlow
```

### 2. Configure the API

Create `api/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow"
JWT_ACCESS_SECRET="replace-with-a-long-random-secret"
JWT_REFRESH_SECRET="replace-with-a-long-random-secret"
JWT_RESET_SECRET="replace-with-a-long-random-secret"
JWT_INVITE_SECRET="replace-with-a-long-random-secret"
INVITE_TOKEN_SECRET="replace-with-a-long-random-secret"
EMAIL_USER="your-email@example.com"
EMAIL_APP_PASSWORD="your-email-app-password"
EMAIL_FROM="TaskFlow <your-email@example.com>"
FRONTEND_URL="http://localhost:5173"
PORT=4000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
LOG_LEVEL="info"
TTL_ACCESS_TOKEN="15m"
TTL_REFRESH_TOKEN="7d"
TTL_RESET_TOKEN="15m"
TTL_INVITE_TOKEN="7d"
```

Install dependencies and prepare the database:

```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API should be available at:

- Health check: `http://localhost:4000/health`
- API docs: `http://localhost:4000/api-docs`

### 3. Configure the Web App

Create `web/.env`:

```env
VITE_API_URL="http://localhost:4000/api"
```

Install dependencies and start the frontend:

```bash
cd web
npm install
npm run dev
```

The web app should be available at `http://localhost:5173`.

## Available Scripts

### API

```bash
npm run dev              # Start the API in watch mode
npm run build            # Compile TypeScript
npm run start            # Run the compiled API
npm run lint             # Run ESLint
npm run lint:fix         # Fix lint issues
npm run format           # Format files with Prettier
npm run format:check     # Check formatting
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run local development migrations
npm run prisma:studio    # Open Prisma Studio
```

### Web

```bash
npm run dev      # Start Vite dev server
npm run build    # Build production assets
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## API Documentation

When the API is running, Swagger documentation is available at:

```text
http://localhost:4000/api-docs
```

The OpenAPI document is generated from the backend route and schema definitions.

## Data Model Summary

Core entities:

- `User`
- `Workspace`
- `WorkspaceMember`
- `Invite`
- `Project`
- `Column`
- `Task`
- `TaskAssignee`
- `Comment`
- `Lead`
- `LeadTaskLink`
- `ActivityLog`

Most workspace-owned entities support soft delete through a shared Prisma
extension.

## Security Notes

- Passwords are hashed with bcrypt.
- Refresh tokens are stored as hashes.
- Refresh token cookies are HTTP-only.
- CSRF protection is applied to cookie-based refresh/logout flows.
- Rate limiting is enabled globally.
- Request payloads are validated with Zod.
- Logs redact sensitive fields such as passwords, tokens, authorization headers,
  and cookies.

## Current Status

The project currently has a working full-stack feature set and can be built
locally. Before using it as a production deployment or a polished hiring demo,
the next improvements should be completed.

## Planned Improvements

- Add committed `.env.example` files for `api` and `web`
- Add automated tests for auth, workspace permissions, tasks, and leads
- Add GitHub Actions for build, lint, format, and test checks
- Add production migration script with `prisma migrate deploy`
- Move shared API schemas/types into a dedicated shared package or generated API
  client
- Add route-level code splitting in the frontend to reduce bundle size
- Add deployment configuration for the chosen hosting platform
- Add demo screenshots and a short product walkthrough

## License

This project is currently maintained as a personal portfolio project.
