---
name: pagatiempo-stack
description: Stack and domain rules for PagaTiempo student installment ledger. Use when adding students, payments, search, FastAPI routes, or React treasurer screens.
---

# PagaTiempo stack

## Domain

- Cycle: 10 consecutive months starting 2026-09-04 (Sep 2026–Jun 2027).
- Treasurer records payments; each student has an independent history.
- Example students: Juan Pérez, María García, Pedro López.
- Default expected quota: `500.00` (RD$).

## Stack

- Frontend: Vite, React 19, TypeScript.
- Backend: FastAPI, SQLAlchemy 2, Pydantic v2.
- Database: PostgreSQL (`DATABASE_URL`). Search with `pg_trgm`.

## Payment allocation

Apply a payment to the chosen month, or to the earliest month with remaining balance. Overflow fills later months. Persist one `payments` row per treasurer action (full amount), then update installment balances.

## Do not

- Store money as `float`.
- Concatenate SQL.
- Mix presentation components with fetch logic.
