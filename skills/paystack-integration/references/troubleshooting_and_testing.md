# Paystack Testing, Test Cards & Troubleshooting Guide

---

## 1. Test Cards (Test Mode Only)

Use the following cards with any future expiry date (e.g. `12/30`) and any 3-digit CVV (e.g. `123`):

| Card Brand | Card Number | Behavior / Response | Required Test Action |
| :--- | :--- | :--- | :--- |
| **Visa (Direct Success)** | `4084084084084081` | Direct success without challenge | None (Succeeds immediately) |
| **Mastercard (Direct Success)** | `5123456789012346` | Direct success without challenge | None (Succeeds immediately) |
| **Verve (Direct Success)** | `5060666666666666` | Direct success without challenge | None (Succeeds immediately) |
| **Card Requiring OTP** | `4084084084084081` | Prompts for One-Time Password | Enter OTP: `123456` |
| **Card Requiring PIN** | `4084084084084081` | Prompts for 4-digit card PIN | Enter PIN: `1234` |
| **Card Requiring 3DS** | `4084084084084081` | Redirects to 3D-Secure ACS page | Click "Authorize" on test bank page |
| **Declined Card (Insufficient Funds)**| `4084084084084082` | Fails with "Insufficient Funds" | Returns error code `400` |

---

## 2. Currency Subunit Quick Reference

Paystack mandates all amounts in the lowest currency subunit (integer):

| Currency | Code | Subunit | Multiplier | Example ($100 / ₦100) |
| :--- | :--- | :--- | :--- | :--- |
| **Nigerian Naira** | `NGN` | Kobo | $\times 100$ | `₦100.00` $\rightarrow$ `10000` |
| **Ghanaian Cedi** | `GHS` | Pesewas | $\times 100$ | `GH₵100.00` $\rightarrow$ `10000` |
| **US Dollar** | `USD` | Cents | $\times 100$ | `$100.00` $\rightarrow$ `10000` |
| **South African Rand** | `ZAR` | Cents | $\times 100$ | `R100.00` $\rightarrow$ `10000` |
| **Kenyan Shilling** | `KES` | Cents | $\times 100$ | `KSh100.00` $\rightarrow$ `10000` |

---

## 3. Common Error Codes & Troubleshooting

| Error Message / Status | Root Cause | Solution |
| :--- | :--- | :--- |
| `Invalid key provided` (401) | Incorrect API key or live key used on test environment. | Verify `Authorization: Bearer sk_...` header and ensure key matches test/live mode. |
| `Duplicate Transaction Reference` (400) | Reusing an existing `reference` string. | Generate a fresh UUID/random string for every `/transaction/initialize` request. |
| `Invalid Signature` on Webhooks (401) | HMAC computed after parsing body to JSON. | Pass the raw UTF-8 body buffer to `crypto.createHmac()`. |
| `Amount cannot be zero or negative` (400) | Sending 0 or floating point formatted string. | Convert amount using `Math.round(amount * 100)`. |
| `Account number could not be resolved` (400) | Invalid NUBAN account number or bank code mismatch. | Ensure 10-digit NUBAN and valid 3-digit CBN bank code are used. |
| `Transfer failed: Insufficient balance` | Your Paystack balance is lower than payout amount + transfer fees. | Fund your Paystack balance via Top-Up on dashboard before initiating payouts. |

