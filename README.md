# Naano rebuild

A responsive Next.js rebuild of the Naano creator-marketing workspace. It includes separate creator and brand experiences, OAuth entry points, MongoDB persistence, campaign applications, collaboration review, and shared messages.

## Stack

- Next.js 15, React 19, TypeScript, Tailwind CSS 4
- MongoDB for creator and brand workspace data
- Google OAuth and LinkedIn OIDC entry points

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add the values you need.
3. Run `npm run dev` and visit `http://localhost:3000`.

Useful commands:

```bash
npm run dev     # local development server
npm run lint    # TypeScript validation
npm run build   # production build
npm run start   # serve the production build
```

Local development uses `.next-dev`, while production builds use Next.js’s standard `.next` directory. This keeps a running development server isolated without changing Vercel’s expected build output.

## Demo paths

- `/` — public landing page
- `/onboarding` — choose creator or brand onboarding
- `/demo` — demo creator workspace
- `/creator` — authenticated creator workspace
- `/brand` — authenticated brand workspace

## Implemented flows

### Creator

- Google sign-in and creator onboarding
- LinkedIn OIDC import when credentials are configured; demo creator fallback
- Creator profile card, opportunities, campaign applications, collaborations, analytics placeholders, community, earnings demo state, and messages
- Applying to a live brand campaign persists the application and exposes it in the brand workspace

### Brand

- Google sign-in and company onboarding
- Creator marketplace, campaign creation/deletion, collaboration review, results, billing demo state, and messages
- A created campaign is saved to MongoDB and becomes an opportunity in the creator workspace
- Accepting an application opens a shared creator–brand conversation

### Messaging

- MongoDB-backed support thread for each signed-in workspace
- Shared collaboration thread after a brand accepts an application
- Local persistence for the demo creator inbox

## Environment variables

See `.env.example` for the complete list. Do not commit `.env` files or OAuth/MongoDB secrets.

For local OAuth, register these callback URLs with the relevant provider:

```text
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/auth/linkedin/callback
```

### Vercel OAuth setup

OAuth providers compare redirect URLs exactly. Before signing in from a Vercel
deployment, add this Production environment variable in **Vercel → Project →
Settings → Environment Variables**:

```text
NAANO_APP_URL=https://your-project.vercel.app
```

Then open **Google Cloud Console → APIs & Services → Credentials → your OAuth
2.0 Client ID** and add this exact value under **Authorized redirect URIs**:

```text
https://your-project.vercel.app/api/auth/google/callback
```

Use the same domain in both places (custom domain or `vercel.app` domain), with
`https`, no trailing slash, and the full `/api/auth/google/callback` path. If
`NAANO_GOOGLE_REDIRECT_URI` exists in Vercel, remove it or change it to that
same value—leaving it set to `http://localhost:3000/...` causes Google’s
`redirect_uri_mismatch` page. Redeploy after changing Vercel environment
variables. Register the corresponding deployed LinkedIn callback as well when
LinkedIn sign-in is enabled:

```text
https://your-project.vercel.app/api/auth/linkedin/callback
```

### MongoDB Atlas on Vercel

The authenticated creator and brand workspaces are persisted in MongoDB. Add
the following values to the **Production** environment in Vercel, then
redeploy:

```text
MONGODB_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority
MONGODB_DB_NAME=naano
MONGODB_AUTH_SOURCE=admin
AUTH_SESSION_SECRET=<a-long-random-secret>
```

In MongoDB Atlas, create the database user, then allow the Vercel application
to connect under **Network Access**. Vercel serverless functions do not have a
single fixed IP, so for this demo the Atlas access list commonly uses
`0.0.0.0/0`; restrict it further when you have a fixed egress solution. If the
database password contains characters such as `@`, `:`, `/`, or `#`, URL-encode
it before putting it in `MONGODB_URI`. Do not wrap the entire Vercel value in
quotes.

## Demo limitations

- LinkedIn follower/post analytics use a demo-safe profile snapshot unless the provider returns those fields.
- Payouts, bank transfer, and Stripe Connect are deliberately not featured in this demo.
- No external AI/LLM API is used.
