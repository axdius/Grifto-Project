# 1. Executive Summary & 34. Final Recommendation

## 1.1 What Grifto is

Grifto is a wedding-gifting platform. Brides and Grooms create gift wishlists, share them via public URLs and QR codes (typically printed on wedding invitations), and receive money from guests. Guests can contribute cash toward an item, reserve an item to bring physically, or arrange to send a gift after the wedding. Contributions accumulate in the couple's wallet, from which they withdraw to a bank account after a configurable platform fee.

The MVP is a consumer web product. The 5-year vision is a Shopify-style ecosystem: a customer dashboard, an admin dashboard with a full theme editor and CMS, Flutter mobile apps, vendor and partner portals, public APIs, a plugin marketplace, and AI copilots — all sharing **one backend with zero duplicated business logic**.

## 1.2 The core architectural bets

This document makes five bets. Everything else follows from them.

### Bet 1 — Modular monolith on NestJS, with microservice seams built in

One deployable backend, internally divided into bounded-context modules (Auth, Users, Wishlist, Payments, Wallet, Notifications, Products, CMS, Theme Engine, Media, Analytics, Search, AI, Admin). Modules communicate through explicit interfaces and domain events — never by reaching into each other's tables. Cross-module side effects flow through a transactional outbox into EventBridge/SQS, which means any module can later be lifted out as a microservice by re-pointing its event subscriptions, not by rewriting it.

*Why not microservices now?* A pre-product-market-fit startup with a small team pays the full distributed-systems tax (network partitions, distributed transactions, per-service CI/CD, observability sprawl) and gets none of the benefit. The failure mode to avoid is not "monolith" — it is "monolith with tangled internals". Module boundaries are the deliverable; deployment topology is a later decision.

### Bet 2 — REST-first API with generated SDKs, one API for every client

A single versioned REST API (OpenAPI 3.1 as the contract) serves the website, admin, Flutter apps, portals, public API consumers, and future AI agents. TypeScript and Dart clients are **generated** from the spec, so "the mobile app requires zero backend changes" is enforced mechanically, not by discipline. GraphQL is deliberately deferred (full trade-off analysis in file 05): its benefits (client-shaped queries) matter most with many divergent clients and a large schema, while its costs (caching complexity, authorization complexity, gateway operations) hit hardest at exactly the MVP stage.

### Bet 3 — PostgreSQL for everything that matters, with JSONB where documents win

One RDS PostgreSQL instance is the source of truth for identity, money, wishlists, CMS, and themes. Relational tables where consistency matters (money, users); JSONB documents where flexibility matters (theme layouts, section settings, notification payloads); `pgvector` for AI embeddings at MVP scale. Redis (ElastiCache) handles caching, sessions, rate limiting, and the BullMQ job queue. OpenSearch, analytics warehouses, and dedicated vector stores are Phase 2+ additions behind interfaces that already exist.

The wallet is a **double-entry immutable ledger**, not a balance column. The PDF's wallet-locking requirement (reserve funds on withdrawal request, restore on rejection) maps exactly to ledger holds. This is non-negotiable for a platform that touches money: balances are derived, entries are append-only, and every rupee is traceable.

### Bet 4 — Schema-driven theme engine shared by web and mobile

The Shopify-style editor is the product's hardest subsystem and is designed as its own engine, not a CMS feature. Sections and blocks are defined by **code-owned schemas** registered in a Component Registry; pages are **JSON layout documents** (template → sections → nested blocks) stored in Postgres; rendering is schema-driven on both Next.js (React components) and Flutter (server-driven UI widgets). Draft/published document pairs, immutable version snapshots, autosave, undo/redo, live preview via draft tokens, and theme import/export all fall out of this one design. Every page — homepage, FAQ, wishlist landing, invitation — is a theme-rendered page. No hardcoded content.

### Bet 5 — Boring, managed AWS infrastructure

CloudFront → WAF → ALB → **ECS Fargate**, RDS Multi-AZ, ElastiCache, S3 + image pipeline, SQS/EventBridge, SES, Secrets Manager/KMS, CloudWatch. Terraform for all infrastructure, GitHub Actions for CI/CD, blue-green deploys via ECS. Estimated MVP cost lands in the scope PDF's ₹15–18k/month band (detailed table in file 10). Nothing exotic; every component is a managed service the team does not have to babysit.

## 1.3 What the MVP ships

| In MVP | Deferred (Phase 2/3) |
|---|---|
| Storefront (theme-rendered), auth, wishlists (manual / URL-scrape / catalog), guest journey with all three gift actions, payments, ledger wallet, withdrawals with admin approval, notifications (in-app + email), admin dashboard (customers, transactions, payouts, product catalog, CMS, theme editor v1, settings, audit log), media pipeline | Flutter apps, OpenSearch, chat, AI features, vendor/partner portals, plugin system, marketplace, multi-currency, multi-tenant white-labeling, A/B testing |

The theme editor ships in MVP as **v1** (sections, blocks, settings, draft/publish, preview, version history) because every marketing page depends on it; advanced capabilities (A/B testing, theme marketplace, import/export UI) layer on later without schema changes.

## 1.4 Final recommendation (deliverable §34)

**Build the modular monolith exactly as specified in these documents, and resist two temptations:**

1. **Do not start with microservices, GraphQL federation, EKS, or a separate analytics stack.** Each is a legitimate future step; each is a startup-killing distraction now. The architecture documents define the exact trigger conditions for adopting each one (file 12, Scalability Plan).
2. **Do not cut corners on the three "expensive-to-retrofit" subsystems:** the wallet ledger, the theme engine's document model, and the event outbox. These are cheap to build correctly now and near-impossible to retrofit under load. Everything else — search, AI, chat, portals — bolts on cleanly if these three are right.

**Sequencing recommendation:** ship in this order — (1) auth + wishlist + guest journey with payments and ledger wallet, (2) admin dashboard with payout approval and product catalog, (3) theme engine v1 replacing the temporary hardcoded storefront, (4) notifications hardening + media pipeline, (5) Flutter apps consuming the already-stable SDK. The theme engine intentionally comes *after* first revenue-capable release: a hardcoded homepage can earn money; an empty theme editor cannot.

**Team-shape assumption:** 2–4 engineers for MVP. Every choice (TypeScript end-to-end, one repo, one database, managed services) minimizes the number of distinct skills required. The single biggest architectural risk is the theme editor's scope; it is contained by the v1/v2 split in file 07.
