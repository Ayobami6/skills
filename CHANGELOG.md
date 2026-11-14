# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
