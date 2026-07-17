# Grifto — Production Architecture Document

**Version:** 1.0
**Status:** Proposed
**Scope:** Complete platform architecture — MVP through 5+ year SaaS evolution
**Business requirements source of truth:** `Grifto — Project scope and functional document.pdf` (repo root)

---

## How to read this document

The architecture is split into 12 files, ordered roughly from "what we are building" to "how we operate it". Each file is self-contained but cross-references the others. The table below maps the 34 required deliverable sections to their files.

| # | Deliverable Section | File |
|---|---|---|
| 1 | Executive Summary | [01-executive-summary.md](01-executive-summary.md) |
| 2 | High-Level System Architecture | [02-system-architecture-and-stack.md](02-system-architecture-and-stack.md) |
| 3 | Complete Technology Stack | [02-system-architecture-and-stack.md](02-system-architecture-and-stack.md) |
| 4 | Why Each Technology Was Chosen | [02-system-architecture-and-stack.md](02-system-architecture-and-stack.md) |
| 5 | Monorepo Structure | [03-monorepo-and-folder-structure.md](03-monorepo-and-folder-structure.md) |
| 6 | Folder Structure | [03-monorepo-and-folder-structure.md](03-monorepo-and-folder-structure.md) |
| 7 | Frontend Architecture | [04-frontend-architecture.md](04-frontend-architecture.md) |
| 8 | Backend Architecture | [05-backend-and-api.md](05-backend-and-api.md) |
| 9 | Flutter Architecture | [06-flutter-architecture.md](06-flutter-architecture.md) |
| 10 | Admin Dashboard Architecture | [07-admin-theme-builder-cms.md](07-admin-theme-builder-cms.md) |
| 11 | Shopify-Style Theme Builder Architecture | [07-admin-theme-builder-cms.md](07-admin-theme-builder-cms.md) |
| 12 | CMS Architecture | [07-admin-theme-builder-cms.md](07-admin-theme-builder-cms.md) |
| 13 | Database Design | [08-database-design.md](08-database-design.md) |
| 14 | Entity Relationship Diagram | [08-database-design.md](08-database-design.md) |
| 15 | API Design | [05-backend-and-api.md](05-backend-and-api.md) |
| 16 | Authentication Flow | [05-backend-and-api.md](05-backend-and-api.md) |
| 17 | Authorization Strategy | [05-backend-and-api.md](05-backend-and-api.md) |
| 18 | AWS Infrastructure Diagram | [10-aws-infrastructure-and-devops.md](10-aws-infrastructure-and-devops.md) |
| 19 | DevOps Pipeline | [10-aws-infrastructure-and-devops.md](10-aws-infrastructure-and-devops.md) |
| 20 | Security Architecture | [11-security-performance-media.md](11-security-performance-media.md) |
| 21 | Caching Strategy | [11-security-performance-media.md](11-security-performance-media.md) |
| 22 | Search Architecture | [11-security-performance-media.md](11-security-performance-media.md) |
| 23 | Notification Architecture | [11-security-performance-media.md](11-security-performance-media.md) |
| 24 | Payment Architecture | [09-payments-and-wallet.md](09-payments-and-wallet.md) |
| 25 | Wallet Architecture | [09-payments-and-wallet.md](09-payments-and-wallet.md) |
| 26 | Media Management | [11-security-performance-media.md](11-security-performance-media.md) |
| 27 | AI Integration Strategy | [12-ai-plugins-and-roadmap.md](12-ai-plugins-and-roadmap.md) |
| 28 | Plugin Architecture | [12-ai-plugins-and-roadmap.md](12-ai-plugins-and-roadmap.md) |
| 29 | Scalability Plan | [12-ai-plugins-and-roadmap.md](12-ai-plugins-and-roadmap.md) |
| 30 | MVP vs Phase 2 vs Phase 3 | [12-ai-plugins-and-roadmap.md](12-ai-plugins-and-roadmap.md) |
| 31 | Estimated Infrastructure Cost | [10-aws-infrastructure-and-devops.md](10-aws-infrastructure-and-devops.md) |
| 32 | Risks and Mitigations | [12-ai-plugins-and-roadmap.md](12-ai-plugins-and-roadmap.md) |
| 33 | Best Practices | [12-ai-plugins-and-roadmap.md](12-ai-plugins-and-roadmap.md) |
| 34 | Final Recommendation | [01-executive-summary.md](01-executive-summary.md) |

## Decision log (headline decisions)

| Decision | Choice | Where argued |
|---|---|---|
| Backend architecture style | Modular monolith (NestJS/TypeScript) with event-driven seams | 02, 05 |
| API style | REST-first + OpenAPI-generated SDKs; GraphQL deferred | 05 |
| Primary database | PostgreSQL (RDS), JSONB for layout documents, pgvector for AI | 08 |
| Wallet model | Double-entry immutable ledger with hold-based balance locking | 09 |
| Web frontend | Next.js App Router (two apps: storefront + admin) in a Turborepo | 03, 04 |
| Theme engine | Schema-driven component registry + JSON layout documents (Shopify model) | 07 |
| Mobile | Flutter, generated Dart SDK, server-driven UI for CMS screens | 06 |
| Compute | ECS Fargate (not EC2, not EKS) | 10 |
| Async backbone | Transactional outbox → EventBridge/SQS; BullMQ (Redis) for jobs | 02, 05 |
| CI/CD & IaC | GitHub Actions + Terraform | 10 |

## Where this document deviates from the scope PDF

The functional PDF is treated as the source of truth for **business behavior**. Its infrastructure appendix (EC2 single server, optional ALB, optional CI/CD) is treated as a suggestion and is deliberately improved:

1. **ECS Fargate instead of a single EC2 box** — same monthly cost band at MVP size, but zero-downtime deploys, auto-scaling, and no server patching. Argued in file 10.
2. **CI/CD and ALB are not optional** — a payments platform cannot deploy by SSH. Argued in file 10.
3. **Redis is included at MVP** — it is the job-queue backbone (withdrawals, notifications, emails must be async from day one), not just a cache. Argued in files 05 and 11.
4. **A real ledger instead of a wallet balance column** — the PDF's wallet-locking requirement is implemented as ledger holds, which is the only design that survives an audit. Argued in file 09.
5. **The theme editor is a first-class subsystem**, not a CMS afterthought — the PDF requires "all textual content configurable through the CMS"; the product vision requires a Shopify-grade editor. Both are served by one schema-driven engine. Argued in file 07.
