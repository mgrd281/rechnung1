# Create Admin User Script

This script creates or updates an admin user in the database with secure password hashing.

## ✅ Secure Usage

**The script reads credentials from environment variables - NO hardcoded passwords!**

### Local Development:

```bash
ADMIN_EMAIL=mgrdegh@web.de ADMIN_PASSWORD='1532@@@' npx tsx scripts/create-admin-user.ts
```

### Production (Railway):

1. **Option A: Via Railway CLI**
```bash
railway run ADMIN_EMAIL=mgrdegh@web.de ADMIN_PASSWORD='1532@@@' npx tsx scripts/create-admin-user.ts
```

2. **Option B: Via Railway Shell**
- Go to Railway Dashboard
- Open your project
- Click on "Shell" tab
- Run:
```bash
ADMIN_EMAIL=mgrdegh@web.de ADMIN_PASSWORD='1532@@@' npx tsx scripts/create-admin-user.ts
```

3. **Option C: Add to Railway Variables (TEMPORARY)**
- Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to Railway variables
- Run the script
- **IMMEDIATELY DELETE** these variables after running!

## 🔒 Security Notes

- ✅ Passwords are NEVER stored in code
- ✅ Passwords are hashed with bcrypt (12 rounds)
- ✅ Environment variables are used for credentials
- ✅ Password is NOT shown in output
- ⚠️ Do NOT commit credentials to git!

## What it does

1. Checks if user with given email exists
2. If exists: Updates password (hashed)
3. If not: Creates new user with ADMIN role
4. Marks email as verified
5. Outputs success message (password hidden)

## Error Handling

If you don't provide environment variables:
```
❌ Error: Missing environment variables!
Please set ADMIN_EMAIL and ADMIN_PASSWORD
```
