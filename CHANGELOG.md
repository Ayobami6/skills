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
- Added `flutterwave-integration` to `README.md` and updated `package.json` keywords.
