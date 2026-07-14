# Privacy Policy

**Not legal advice.** This template is written to match exactly what the
`nexus-auth-backend` codebase collects and stores, so it should stay accurate
as long as your actual data handling matches the code — but have a lawyer
confirm it covers your jurisdiction's requirements (GDPR, CCPA, etc.) before
publishing it.

*Last updated: [DATE]*

## What we collect

Account creation and login are handled by **Supabase Auth**. When you create
an account, Supabase stores:
- Your **email address**.
- A **hash of your password** (Supabase uses bcrypt under the hood) — never
  the password itself.
- Your **email-verification status** and **account creation timestamp**.

We additionally store, in our own `profiles` table alongside Supabase Auth:
- Your **username**.
- Your **account role** (`user` or `admin`).

Your session is managed by Supabase Auth's client library, which keeps a
JSON Web Token (JWT) in your browser to keep you signed in. We don't set our
own separate session cookie.

## What we don't collect

This codebase does not include analytics, advertising trackers, or
third-party pixels by default. If you add any (Google Analytics, an ad
network, a support-chat widget, etc.), **update this section** — an
inaccurate privacy policy is worse than none.

## Email

We send transactional email only: an account-verification link at signup,
and a new one if you request a resend. [If you later add marketing email,
password-reset email, etc., list those here too, and describe how to opt
out of anything non-essential.]

Email is sent via [YOUR SMTP PROVIDER — e.g. SendGrid / Amazon SES], which
processes your email address and message content on our behalf under their
own data-processing terms: [LINK TO PROVIDER'S DPA].

## Where data is stored

Account data is stored in a Postgres database managed by **Supabase**, in
the region you chose when creating your Supabase project: [YOUR SUPABASE
PROJECT REGION]. Supabase's own subprocessor terms apply to how they handle
infrastructure: [LINK TO SUPABASE'S DPA]. [State your actual retention
policy and how a user can request deletion.]

## Your rights

You can request a copy of your data or ask us to delete your account by
contacting [CONTACT EMAIL]. [If you're subject to GDPR/CCPA, expand this
section with the specific rights those laws require — access, correction,
portability, deletion, and the timelines you commit to.]

## Changes to this policy

[Describe your actual notice process for policy changes.]

## Contact

Questions about this policy: [CONTACT EMAIL]
