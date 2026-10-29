# Mini SMS Gateway API

A backend SMS gateway built with **Node.js, Express.js, PostgreSQL, and Prisma ORM**. The application provides cookie-based JWT authentication, wallet-based SMS billing, multiple mock SMS providers, automatic provider failover, delivery tracking, and provider health monitoring.

This project was developed as a backend internship assignment, focusing on API security, database transactions, reliability, and concurrency handling.

## Features

### Core Features

- **Authentication:** User registration and login with JWT-based authentication using HTTP-only cookies.
- **Wallet Management:** Each user receives a wallet with an initial balance of 1,000 credits.
- **SMS Segmentation:** Calculates SMS parts based on GSM-7 and Unicode encoding.
- **Wallet Billing:** Deducts credits according to the number of SMS parts.
- **Mock SMS Providers:** Supports multiple providers with configurable priorities, balances, and failure rates.
- **Automatic Provider Failover:** Attempts delivery through eligible providers in priority order.
- **Transactional Wallet Deduction:** Uses database-level safeguards to prevent concurrent requests from overspending wallet credits.
- **SMS History:** Provides paginated SMS logs with status, date, and phone-number filters.
- **Provider Health Monitoring:** Reports provider balances, delivery statistics, success rates, and health scores over the last 24 hours.
- **Automatic Refunds:** Refunds wallet credits when all eligible providers fail to deliver an SMS.
- **Per-User Rate Limiting:** Limits authenticated SMS send requests to 60 requests per minute.

### Security and Reliability

- JWT authentication through HTTP-only cookies
- Password hashing with bcrypt
- Request validation using Zod
- Secure HTTP headers with Helmet
- CORS configuration with credential support
- Database-backed SMS and provider-attempt records
- Concurrent wallet-spending protection
- Rate-limit testing with parallel HTTP requests

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| JSON Web Token | Authentication |
| cookie-parser | Reading authentication cookies |
| bcrypt | Password hashing |
| Zod | Request validation |
| express-rate-limit | Rate limiting |
| Helmet | HTTP security headers |
| CORS | Cross-origin request configuration |
| dotenv | Environment configuration |

## Project Structure

```text
server/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── config/
│   │   └── prisma.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── sms.controller.js
│   ├── middlewares/
│   │   ├── auth.middlewares.js
│   │   └── rateLimit.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── sms.routes.js
│   │   └── route.routes.js
│   ├── services/
│   │   └── sms.service.js
│   ├── utils/
│   │   └── sms.utils.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
└── README.md
```

*Note: The structure above reflects the intended project layout. Keep only files and directories that actually exist in your repository.*

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git (optional)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/gurungsanjeev/sms_gateway.git
cd sms_gateway/server
```

### 2. Install Dependencies

```bash
npm install
```

This project uses Prisma 6.19.3. Keep the Prisma CLI and Prisma Client versions compatible with the project.

If these packages are missing, install the pinned versions:

```bash
npm install -D prisma@6.19.3
npm install @prisma/client@6.19.3
```

Verify the installed versions:

```bash
npm list prisma @prisma/client
```

Both packages should use version `6.19.3`.

### 3. Configure Environment Variables

Create a `.env` file inside the `server/` directory.

```env
PORT=8000
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/nest_sms?schema=public"
JWT_SECRET="replace_with_a_long_random_secret"
```

Replace the database username, password, and JWT secret with your local configuration.

**Security notes:**

- Never commit `.env` files, database credentials, JWT secrets, or authentication tokens.
- Use a strong, private JWT secret.
- Configure cookie security settings appropriately for your environment.

Ensure your Prisma configuration loads the environment variables needed by the application and database connection.

### 4. Set Up the PostgreSQL Database

Create a PostgreSQL database named `nest_sms`, or update `DATABASE_URL` to point to your existing database.

Generate Prisma Client:

```bash
npx prisma generate
```

Apply existing migrations:

```bash
npx prisma migrate dev
```

If you are initializing the project from scratch and have no existing migrations, create the initial migration instead:

```bash
npx prisma migrate dev --name init
```

Do not create a duplicate initial migration if migrations are already present.

### 5. Seed Mock Providers

Run the seed script:

```bash
node prisma/seed.js
```

The application uses mock providers such as:

- `MockProviderA`
- `MockProviderB`
- `MockProviderC`

The providers have configurable priorities, balances, and failure rates.

Run the seed script against the intended development database. If the script is not idempotent, avoid running it repeatedly without checking for duplicate records.

### 6. View Database Records with Prisma Studio

Prisma Studio provides a browser-based interface for inspecting database tables and records.

First, ensure Prisma Client has been generated:

```bash
npx prisma generate
```

Start Prisma Studio:

```bash
npx prisma studio
```

Open the local URL printed in your terminal, usually:

```text
http://localhost:5555
```

You can browse the tables defined in your Prisma schema, including:

- **User:** Registered users
- **Wallet:** User credit balances
- **Provider:** Provider priorities, balances, and configurations
- **SMS message model:** SMS records and delivery statuses
- **SMS attempt model:** Provider delivery attempts and their outcomes

The exact table names depend on your Prisma schema.

**Alternative: Inspect data using SQL**

Connect to the database using PostgreSQL's command-line client:

```bash
psql -U YOUR_DB_USER -d nest_sms
```

List tables:

```sql
\dt
```

View users:

```sql
SELECT * FROM "User";
```

View wallets:

```sql
SELECT * FROM "Wallet";
```

View providers:

```sql
SELECT * FROM "Provider";
```

Exit the PostgreSQL shell:

```sql
\q
```

Use the actual model and table names defined in your schema if they differ.

### 7. Start the Server

Run in development mode:

```bash
npm run dev
```

Or start the application using:

```bash
npm start
```

The API runs at:

```text
http://localhost:8000
```

## API Documentation

### Health Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Checks whether the API is running |
| GET | `/health/db` | Checks PostgreSQL connectivity |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Registers a user and initializes a wallet |
| POST | `/api/auth/login` | Authenticates a user and sets the JWT cookie |

#### Register a User

**Endpoint:** `POST /api/auth/register`

Example request:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "your_password"
}
```

The registration endpoint creates the user and initializes their wallet.

#### Log In

**Endpoint:** `POST /api/auth/login`

Example request:

```json
{
  "email": "test@example.com",
  "password": "your_password"
}
```

After successful authentication, the server issues a JWT and sets it in an HTTP-only cookie.

The token is not intended to be read by frontend JavaScript. The browser stores the cookie according to its security settings and sends it with eligible requests.

#### Cookie-Based Authentication

Protected endpoints use the `token` cookie rather than an `Authorization: Bearer` header.

The authentication middleware:

1. Reads the token from `req.cookies.token`.
2. Verifies the token using the configured JWT secret.
3. Identifies the authenticated user.
4. Allows the request to continue if authentication succeeds.
5. Returns HTTP `401 Unauthorized` if the token is missing, invalid, or expired.

For a frontend running on a separate origin, configure the client to include credentials.

Example using the browser Fetch API:

```javascript
const response = await fetch(
  "http://localhost:8000/api/sms/logs",
  {
    method: "GET",
    credentials: "include"
  }
);
```

For Axios:

```javascript
axios.get("http://localhost:8000/api/sms/logs", {
  withCredentials: true
});
```

The Express CORS configuration must allow the frontend origin and credentials. Cookie settings such as `Secure` and `SameSite` must also be compatible with the deployment environment.

**Note:** HTTP-only cookies help prevent client-side JavaScript from reading the JWT. They do not eliminate the need to consider CSRF protection and other web security concerns.

### SMS Operations

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sms/send` | Sends SMS messages to one or more recipients |
| GET | `/api/sms/logs` | Retrieves paginated SMS history |

Both endpoints require authentication.

#### Send SMS

**Endpoint:** `POST /api/sms/send`

Example request:

```json
{
  "to": ["9841234567"],
  "message": "Hello, this is a test SMS."
}
```

The client must include the valid authentication cookie.

The application validates the request, normalizes recipient phone numbers, calculates SMS parts and cost, checks wallet credits, deducts the required credits, and attempts delivery through the mock providers.

A successful delivery is recorded with the appropriate status and provider information. If every eligible provider fails, the application records the failure and refunds the applicable wallet credits.

The exact response structure depends on the API controller's returned fields.

#### SMS Logs

**Endpoint:** `GET /api/sms/logs`

Authentication is required.

Supported query parameters:

| Parameter | Description |
|---|---|
| `page` | Page number |
| `limit` | Number of records per page |
| `status` | Filter by SMS status |
| `from` | Filter by start date |
| `to` | Filter by end date |
| `number` | Filter by recipient phone number |

Example:

```http
GET /api/sms/logs?page=1&limit=10&status=SENT
```

The response includes SMS records and pagination metadata, such as the current page, page size, total records, and total pages.

### Provider Health Monitoring

**Endpoint:** `GET /routes/health`

Returns provider information, including priorities, balances, delivery statistics, success rates, and health scores for the previous 24 hours.

The health score uses the following formula:

```text
Health Score = (Success Rate × 0.7) + (Balance Score × 0.3)
```

Where:

```text
Success Rate =
  (Successful Attempts / Total Attempts) × 100

Balance Score =
  MIN((Provider Balance / 10,000) × 100, 100)
```

Both metrics use a scale from 0 to 100. Delivery reliability contributes 70% of the health score, while available provider balance contributes 30%.

When a provider has no recorded attempts during the evaluation period, its success rate and health score are returned as `null` because there is insufficient delivery history to calculate them.

The balance score assumes that `10,000` is the reference balance. Update this threshold if the application uses a different reference value.

## SMS Billing and Provider Failover

The SMS sending workflow follows these steps:

1. Authenticate the user.
2. Validate and normalize recipient phone numbers.
3. Calculate SMS parts based on message encoding and length.
4. Calculate the required credits.
5. Verify and deduct wallet credits safely.
6. Select eligible providers according to priority and available balance.
7. Attempt delivery through providers and record each attempt.
8. Mark the SMS as sent if delivery succeeds.
9. Try the next eligible provider if delivery fails.
10. Refund wallet credits if all eligible providers fail.

Wallet deductions use database-level safeguards to prevent simultaneous requests from spending more credits than the user owns.

## Rate Limiting

The SMS send endpoint applies a per-user rate limit of **60 requests per minute**.

Requests exceeding the limit receive HTTP `429 Too Many Requests`.

Example response:

```json
{
  "success": false,
  "message": "Too many SMS requests. Please try again in a minute."
}
```

The rate limiter runs after JWT authentication so requests are associated with the authenticated user.



## Testing and Verification

The following behaviors have been manually tested during development:

- User registration and login
- Cookie-based JWT authentication
- SMS delivery and provider failover
- Wallet-credit deduction and refunds
- SMS segmentation for GSM-7 and Unicode messages
- Paginated SMS history
- Provider health monitoring
- Concurrent wallet spending
- Per-user rate limiting

### Wallet Concurrency Test

The concurrency test sent 20 parallel SMS requests when the wallet had enough credits for exactly 10 requests.

Observed outcome:

- 10 requests succeeded.
- 10 requests were rejected for insufficient wallet credits.
- No additional requests overspent the wallet.

### Rate-Limit Test

The rate-limit test sent 61 parallel authenticated requests to a temporary test endpoint that used the same rate-limiting middleware.

Observed outcome:

- 60 requests returned HTTP `200`.
- 1 request returned HTTP `429`.
- 0 network errors occurred.




