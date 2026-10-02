# e-Complaint Box — Full Stack

Production-oriented college project with React + Express + PostgreSQL.

## Local setup
1. Install Node.js 18+.
2. Create a PostgreSQL database named `ecomplaintbox`.
3. Copy `.env.example` to `.env`.
4. Set `DATABASE_URL` and a strong `JWT_SECRET`.
5. Run `npm install`.
6. Run `npm run dev`.

Admin defaults are controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## API
- POST `/api/complaints` — anonymous complaint submission
- GET `/api/complaints/:id` — public tracking
- POST `/api/auth/login` — admin login
- GET `/api/admin/complaints` — protected admin list
- PUT `/api/admin/complaints/:id` — protected update
- DELETE `/api/admin/complaints/:id` — protected delete
- GET `/api/health` — database health

## Deployment
Recommended free-tier pattern:
- Frontend/API can be hosted on a service that supports Node/Express.
- PostgreSQL can be hosted on a free-tier PostgreSQL provider.
- Set environment variables in the host dashboard.
- Use the generated HTTPS URL as `CLIENT_URL`.

Before public deployment, change the demo admin password and JWT secret.
