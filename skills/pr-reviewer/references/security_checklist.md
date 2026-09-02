# Security Checklist for PR Reviews

When evaluating code for security risks, verify each of the following areas:

## 1. Secrets & Credentials
- [ ] No hardcoded passwords, API keys, JWT secrets, private certificates, or tokens.
- [ ] Ensure `.env` files or secret configs are in `.gitignore` and not committed.
- [ ] Sensitive keys are accessed strictly via environment variables or secret managers.

## 2. Injection Flaws
- [ ] **SQL Injection**: All database queries use parameterized statements / ORM queries; no raw string concatenations.
- [ ] **Command Injection**: Avoid shell invocation with raw inputs (`exec`, `system`, `popen`). Use safe parameter arrays.
- [ ] **XSS (Cross-Site Scripting)**: Unsanitized user inputs are not directly rendered into HTML (e.g. `dangerouslySetInnerHTML`, `v-html`, unescaped template tags).
- [ ] **Path Traversal**: File path manipulations validate and sanitize inputs against `../` directory traversal.

## 3. Authentication & Authorization (AuthN & AuthZ)
- [ ] Endpoints and RPC handlers enforce authentication checks.
- [ ] Object-level access control (IDOR prevention): Checks if the current authenticated user owns or is authorized to access the requested resource ID.
- [ ] Role-based access control (RBAC): Admin or sensitive actions check proper role/permission assignments.

## 4. Data Exposure & Logging
- [ ] PII (Personally Identifiable Information), passwords, tokens, or credit cards are not logged in plaintext.
- [ ] Error messages returned to clients/users do not leak internal stack traces, server paths, or database schemas.

## 5. Input Validation & Deserialization
- [ ] Input payload types, sizes, and formats are validated using schemas (e.g., Zod, Pydantic, Joi).
- [ ] Safe deserialization practices (avoid unsafe `pickle.loads`, `eval`, or unsafe YAML loading).

## 6. Dependency & Supply Chain Security
- [ ] No known vulnerable dependencies introduced.
- [ ] Package manifest versions are pinned appropriately.

