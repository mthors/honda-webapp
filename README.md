# Honda Satrya Dealer Group Digital Showroom

A digital showroom web application for Honda Mega Persada Mandiri, featuring a public motorcycle catalog, local on-the-road (OTR) pricing, customer inquiry forms, and an administrative CMS for managing showroom content.

## Tech Stack

- **Framework:** Next.js (App Router, Turbopack) & React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Utilities:** ExcelJS (inquiry export), Zod (schema validation)
- **Testing:** Vitest, Testing Library, Playwright

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) project

## Installation & Setup

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd honda-webapp
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your configuration in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_DEALER_WHATSAPP=[Your Admin Whatsapp Number]
```

### 3. Run Locally

Start the development server:

```bash
npm run dev
```

- Public showroom: [http://localhost:3000](http://localhost:3000)
- Admin portal: [http://localhost:3000/admin](http://localhost:3000/admin)

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts local Next.js development server |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Starts Next.js production server |
| `npm run typecheck` | Checks TypeScript types with `tsc` |
| `npm run lint` | Runs ESLint checks |
| `npm test` | Runs unit and component tests with Vitest |
| `npm run test:e2e` | Runs end-to-end browser tests with Playwright |

## Documentation

For full project specifications, database schema, and architecture details, refer to:
- [`01-product-requirements.md`](./01-product-requirements.md)
- [`02-technical-architecture.md`](./02-technical-architecture.md)
- [`03-database-schema.md`](./03-database-schema.md)
- [`05-admin-and-sales-workflows.md`](./05-admin-and-sales-workflows.md)
- [`DESIGN.md`](./DESIGN.md)
