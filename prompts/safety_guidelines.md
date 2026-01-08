# Prompts Folder - Safety Guidelines

This folder contains conversation summaries and prompts used during development with Claude Code.

## 🔒 SECURITY RULES - READ BEFORE COMMITTING

### ❌ NEVER Commit These:

1. **API Keys & Secrets**
   - Supabase keys (`sb_secret_*`, `sb_publishable_*`)
   - Clerk API keys
   - Anthropic API keys
   - Stripe keys
   - ngrok auth tokens
   - Any tokens or credentials

2. **Environment Variables**
   - Never paste full `.env` file contents
   - Never show actual values from `.env.local`

3. **Sensitive Data**
   - Real user emails or personal information
   - Database connection strings with credentials
   - OAuth tokens or session IDs

### ✅ ALWAYS Do This:

1. **Use Placeholders**
   ```
   ✅ GOOD:
   SUPABASE_SECRET_KEY=your_secret_key_here
   SUPABASE_SECRET_KEY=***REDACTED***
   SUPABASE_SECRET_KEY=xxx_redacted_xxx

   ❌ BAD (example of real key - never do this):
   SUPABASE_SECRET_KEY=<actual_secret_key_here>
   ```

2. **Redact Before Saving**
   - If you accidentally paste a secret, immediately replace it with `xxx` or `***REDACTED***`
   - Use find-and-replace to ensure all instances are redacted

3. **Review Before Committing**
   - Always review your prompt files before `git add`
   - The pre-commit hook will catch secrets, but manual review is best
   - When in doubt, ask Claude to scan the file for secrets

### 📝 File Naming Convention

- `prompts_DDMMMYYYY.md` - Daily conversation summaries (e.g., `prompts_08JAN2026.md`)
- `prompts_*_PRIVATE.md` - Private files (automatically ignored by git)

### 🛡️ Pre-Commit Protection

This repository has a pre-commit hook that scans for common secret patterns:
- API keys (Supabase, Stripe, AWS, Google, etc.)
- JWT tokens
- OAuth tokens
- GitHub tokens

If secrets are detected, the commit will be **blocked** automatically.

### ⚠️ If You Accidentally Commit Secrets

1. **STOP** - Don't push to GitHub yet
2. **Rotate the keys immediately** in the respective dashboard
3. **Contact the team lead** or refer to the security remediation guide
4. **Clean git history** before pushing (see `CLAUDE.md` for instructions)

### 📚 What's Safe to Include

✅ Code snippets (without secrets)
✅ Error messages
✅ Terminal output (redact any keys/tokens first)
✅ Conversation summaries
✅ Technical discussions
✅ Architecture decisions

---

## Example: Properly Redacted Prompt

```markdown
## Session: Fix Supabase Integration

**Issue:** Connection failing with new keys

**Solution:**
1. Updated .env.local:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=your_secret_key_here  ← PLACEHOLDER, not real key
   ```

2. Restarted dev server
3. Tested connection - ✅ Working
```

---

**Remember:** When in doubt, redact it out! 🔒
