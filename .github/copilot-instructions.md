# Copilot Instructions for naourika-pos

## Project Overview
Naourika-pos is a full-stack Point-of-Sale (POS) system with a TypeScript Express backend and React + TypeScript frontend. It manages transactions, products, customers, and users for a retail/kasir operation.

## Architecture

### Backend (`/backend`)
- **Runtime**: Node.js with Express 5.x, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT tokens (7-day expiration)
- **Key Structure**:
  - `/src/controllers/` - Business logic for each entity
  - `/src/routes/` - API route definitions
  - `/src/middleware/auth.ts` - JWT verification and role checking
  - `/prisma/schema.prisma` - Data models and migrations

**Dev Command**: `npm run dev` (from `/backend` using nodemon + ts-node)

### Frontend (`/frontend`)
- **Runtime**: React 19 with Vite, TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: Axios with React Query
- **Auth Flow**: Context API + localStorage
- **Key Structure**:
  - `/src/context/AuthContext.tsx` - Auth state and login/logout
  - `/src/lib/api.ts` - Axios instance with auto-attached JWT Bearer tokens
  - `/src/pages/` - Page components
  - `/src/components/` - Reusable UI components (Layout, Receipt, ReceiptModal)

**Dev Commands**: 
- `npm run dev` - Start Vite dev server
- `npm run build` - TypeScript compile + Vite build

## Data Model & Key Patterns

### Core Entities
1. **User** (`ADMIN` | `KASIR` roles)
   - Password is bcrypted (bcryptjs@3.0.3)
   - JWT payload: `{ id, username, role }`
   - Authentication required on all protected routes

2. **Product**
   - Three price points: `hargaModal`, `hargaJual` (retail), `hargaReseller`
   - Stock management with automatic updates on transaction
   - `StockHistory` tracks "IN"/"OUT" movements

3. **Transaction**
   - Sequential invoice numbering: `INV-YYYYMMDD-XXXXXX` (6-digit daily counter)
   - Items reference products with snapshot pricing (`price` field)
   - Optional `customerId` for loyalty/points tracking
   - Cascade delete on items when transaction is deleted

4. **Customer**
   - `points` field for loyalty system
   - Unique phone constraint
   - Linked to transactions via optional `customerId`

### Important Patterns

**API Response Format**: All endpoints return JSON with error messages in `error` field (string) or `data` object.

**JWT Middleware**: Routes requiring auth use `authenticateToken` middleware. Admin routes add `requireAdmin` check.

**Transaction Creation Flow**:
```typescript
// POST /api/transactions
// Requires: items[], paymentMethod, userId (from JWT)
// Optional: customerName, customerPhone, notes, customerId
// Auto-generated: invoiceNumber, totalAmount
// Side effects: Updates product stock, creates StockHistory, links customer if provided
```

**Axios Auto-Auth**: Frontend's `api.ts` interceptor automatically appends `Authorization: Bearer {token}` to all requests if token exists in localStorage.

## Development Workflows

### Setup
1. `cd backend && npm install && npx prisma db push` (or migrate)
2. `cd ../frontend && npm install`
3. Create `.env` in `/backend`: `PORT=5000`, `JWT_SECRET=your-secret`, `DATABASE_URL=postgresql://...`

### Database Migrations (Backend)
- Edit `schema.prisma`
- Run `npx prisma migrate dev --name <migration_name>` to create + apply
- Migrations stored in `/prisma/migrations/`

### Common Changes
- **Add new API endpoint**: Create controller in `/backend/src/controllers/`, route in `/backend/src/routes/`, mount in `server.ts`
- **Add new model**: Define in `schema.prisma`, migrate, then create controller/routes
- **Add frontend page**: Create in `/src/pages/`, add route in `App.tsx` with `<PrivateRoute>` wrapper
- **Change auth role logic**: Edit middleware in `/backend/src/middleware/auth.ts` or controller-level checks

## Code Style & Conventions

- **Naming**: camelCase for functions/variables, PascalCase for React components
- **Exports**: Named exports preferred (e.g., `export const loginUser = ...`)
- **Error Handling**: Try-catch in controllers, return 500 with `{ error: 'message' }` for unexpected errors
- **Database Queries**: Always use `include` for relationships explicitly needed (e.g., transaction includes items + user)
- **Routes**: Public routes (auth) unprotected; others wrapped with `authenticateToken`; admin endpoints also check `requireAdmin`

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Data model definitions |
| `backend/src/server.ts` | Route mounting and middleware setup |
| `backend/src/middleware/auth.ts` | JWT verification + role checks |
| `frontend/src/lib/api.ts` | Axios instance with auto-auth interceptor |
| `frontend/src/context/AuthContext.tsx` | Global auth state + login/logout |
| `frontend/src/App.tsx` | Route definitions and PrivateRoute wrapper |

## External Dependencies
- **Backend**: express, @prisma/client, jsonwebtoken, bcryptjs, cors, dotenv
- **Frontend**: react, react-router-dom, axios, @tanstack/react-query, tailwindcss, recharts (charts), lucide-react (icons)

## Common Gotchas
1. **JWT Secret**: Must be set in `.env` as `JWT_SECRET` - backend will crash silently if missing
2. **CORS**: Enabled globally in `server.ts` but Frontend must hit `http://localhost:5000/api` (hardcoded in `api.ts`)
3. **Stock Updates**: Done inline during transaction creation; no separate stock API endpoint
4. **Invoice Numbers**: Generated per day; changing date logic will break sequential ordering
5. **Customer Optional**: Transactions can be created without customerPhone/customerId (walk-in sales)
