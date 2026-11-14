# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created `psprelay-integration` skill for downstream product microservices integrating with PSP Relay (github.com/Ayobami6/psprelay):
  - Core downstream integration skill document (`SKILL.md`) covering downstream HMAC-SHA256 signature verification (`X-PSPRelay-Signature`), idempotent event processing via `X-PSPRelay-Event-ID`, strict <5-second fast acknowledgment, outbound payment reference tagging (HMAC prefix tokens and plaintext prefixes), exact byte-for-byte provider payloads, retry tracking (`X-PSPRelay-Retry-Attempt`), and Dead-Letter Queue (DLQ) recovery.
  - Relayed request headers and provider payload reference (`references/api_and_payload_reference.md`) covering Paystack (`charge.success`), Flutterwave (`charge.completed`), Monnify (`SUCCESSFUL_TRANSACTION`), and Admin API replay endpoints (`POST /v1/admin/events/:id/replay`).
  - Cryptographic signature verification guide (`references/downstream_verification.md`) with constant-time HMAC-SHA256 implementations across Express, Next.js App Router, FastAPI, Django, Go, and Rust.
  - Outbound payment reference tagging guide (`references/outbound_reference_tagging.md`) covering HMAC prefix token generation (`hex(HMAC-SHA256(prefix, encodeKey))[:12] + "_" + internalID`), plaintext prefixes, and provider parameter mapping (Paystack `reference`, Flutterwave `tx_ref`, Monnify `paymentReference`).
  - Idempotency and event handling guide (`references/idempotency_and_event_handling.md`) covering database deduplication schemas (`processed_relay_events`), retry counters, fast 2xx responses (<5s), and background worker offloading.
  - Troubleshooting and DLQ guide (`references/troubleshooting_and_dlq.md`) covering 401 signature mismatches, 5-second timeout diagnostics, unmatched reference routing, and manual replay API operations.
- Added `psprelay-integration` to `README.md` and updated `package.json` keywords.
- Created `buffer-integration` skill for Buffer GraphQL API, CLI, and hosted MCP server integration:
  - Core integration skill document (`SKILL.md`) covering GraphQL single-endpoint architecture (`https://api.buffer.com`), bearer token authentication, account hierarchy (Organization $\to$ Channels $\to$ Posts), scheduling modes (`addToQueue`, `customScheduled`, `shareNow`, `shareNext`), platform metadata, and Mermaid workflows.
  - Complete GraphQL schema and API reference (`references/api_reference.md`) covering queries (`account`, `channels`, `posts`, `post`, `ideas`), mutations (`createPost`, `editPost`, `deletePost`, `createIdea`), input types, enums (`ShareMode`, `SchedulingType`, `PostStatus`), and error models.
  - Authentication, CLI, and MCP setup guide (`references/authentication_and_setup.md`) covering personal API keys, OAuth 2.0 PKCE, official `@bufferapp/cli` (`buffer init`, `buffer doctor`), and hosted MCP server configuration (`https://mcp.buffer.com/mcp`).
  - Channels and organizations management guide (`references/channels_and_organizations.md`) covering account hierarchy resolution, channel filtering across 11+ platforms, and queue pause state handling.
  - Post creation, scheduling, editing, and deletion guide (`references/posts_and_scheduling.md`) with scheduling modes, public HTTPS media assets, drafts, and Relay cursor pagination.
  - Platform-specific metadata guide (`references/network_specific_metadata.md`) covering Instagram (Reels, Stories, Feed), Threads, X character limits & threads, LinkedIn document carousels (PDF), TikTok vertical video specs, Pinterest board selection, and accessibility alt text.
  - Organization ideas and draft workflows guide (`references/ideas_and_drafts.md`) covering brainstorm idea capture (`createIdea`), converting ideas into posts, and team approval states.
  - Rate limits and polling synchronization guide (`references/rate_limits_and_polling.md`) covering plan tiers (Free/Essentials/Team), response headers (`RateLimit`, `RateLimit-Policy`, `Retry-After`), exponential backoff on HTTP 429, and timestamp-based polling workers.
- Added `buffer-integration` to `README.md` and updated `package.json` keywords.
- Created `flutterwave-integration` skill for Flutterwave API v3 integration:
  - Core integration skill document (`SKILL.md`) covering essential directives, major currency unit rules, status invariants (`status: "successful"`), and Mermaid workflows.
  - Complete API v3 endpoint reference (`references/api_reference.md`).
  - Multi-language payment flow guides (`references/payment_flows.md`) with TypeScript, Python, and Go implementations for Hosted Checkout, Inline JS SDK v3, Tokenized Recurring Debits, Preauthorization & Capture, and 3DES encryption.
  - Dual webhook security and verification guide (`references/webhook_handling.md`) supporting `verif-hash` header match, `flutterwave-signature` HMAC-SHA256 verification, and mandatory anti-tampering server-side queries across Express, Next.js App Router, FastAPI, and Django.
  - Bank account resolution (NUBAN), transfer fee queries, and single/bulk outbound payout implementation guide (`references/transfers_and_payouts.md`).
  - Dedicated Virtual Accounts (DVA / BVN KYC) and Subaccount Split Payments guide (`references/virtual_accounts_and_subaccounts.md`).
  - Sandbox test cards, mock OTPs, test bank accounts, error simulation codes, and troubleshooting guide (`references/troubleshooting_and_testing.md`).
- Created `obiex-integration` skill for Obiex Crypto & Fiat API integration:
  - Core integration skill document (`SKILL.md`) covering essential directives, base URLs, HMAC-SHA256 request authentication, system currency and network codes, rate limits, and Mermaid integration workflows.
  - Complete v1 REST API endpoint reference (`references/api_reference.md`).
  - Cryptographic authentication and request signing guide (`references/authentication_and_signing.md`) with HMAC-SHA256 implementations across Node.js/TypeScript, Python, Go, and Rust.
  - Cryptocurrency deposit addresses and Multi-Customer Business Collections guide (`references/collections_and_deposits.md`) covering `uniqueUserIdentifier` idempotency and BVN/NIN virtual account KYC name matching.
  - Request for Quote (RFQ) trading and instant currency swaps guide (`references/trading_and_swaps.md`) with 100 req/hr quote rate limit handling and 30-second expiration windows.
  - Outbound payouts and off-ramping guide (`references/payouts_and_withdrawals.md`) covering on-chain crypto debits (`POST /wallets/ext/debit/crypto`), Nigerian bank account resolution, fiat payouts (`POST /wallets/ext/debit/fiat`), and withdrawal status lifecycles.
  - Real-time webhook lifecycle and security guide (`references/webhook_handling.md`) covering `DEPOSIT`, `WITHDRAWAL`, and `COLLECTION` event payloads, server-side anti-tampering verification, and Express, Next.js, FastAPI implementations.
  - Testing, staging sandbox setup, and troubleshooting guide (`references/troubleshooting_and_testing.md`).
- Added `flutterwave-integration` and `obiex-integration` to `README.md` and updated `package.json` keywords.
