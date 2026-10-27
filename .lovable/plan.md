# Set up super admin account

## Goal

Create the account `ishakudelshak@gmail.com` with the password provided in chat and grant it the `super_admin` role, so it can be used immediately to sign in at /auth.

## Current state (verified)

- The public schema has no role tables and no profiles table — no role system exists yet.
- The app has no admin-only pages; roles will be stored and enforced-ready for future admin features.
- psql cannot read the `auth` schema directly, so user creation goes through SQL run as the service/database role.

## Steps

### 1. Create the role system (database)

Run as a one-off SQL script (not committed to the repo, so the password never lands in source code or git history):

- Create enum `app_role` with values `super_admin`, `admin`, `user`.
- Create table `user_roles` (`id uuid` PK default gen_random_uuid, `user_id uuid` referencing `auth.users(id)` on delete cascade, `role app_role` not null, unique on (`user_id`, `role`)).
- Grant: `select` to authenticated, full access to service_role.
- Enable RLS on `user_roles`; add a policy so users can read only their own role rows.
- Create `public.has_role(_user_id uuid, _role app_role)` as a SECURITY DEFINER function (prevents recursive RLS; used by all future admin policies).

### 2. Create the user

- Insert into `auth.users` with the provided email, bcrypt-hashed password (`crypt(..., gen_salt('bf'))`), email marked confirmed, so sign-in works with no verification email step.
- Add the matching row in `auth.identities` (email provider) so the account is fully valid.
- Insert one `user_roles` row assigning `super_admin` to this user.

### 3. Verify

- Query `user_roles` to confirm the role assignment.
- Sign in through the app's /auth page with the email and password, confirm it lands on /app without errors.
- Confirm a second account (or anonymous) cannot claim the role: the table is protected by RLS.

## Notes

- The password was pasted in chat; it will be used once to create the account and not stored anywhere in the project files. If you'd like a different password later, ask and it can be updated.
- No admin dashboard is built in this task — the role plumbing is in place for whenever admin-only features are added (e.g. manage all users' documents). Say the word if you want an admin area now.
