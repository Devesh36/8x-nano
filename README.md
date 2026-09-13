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

Development and production artifacts use separate directories (`.next-dev` and `.next-build`) so running a build does not break a running local development server.

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

For OAuth, register these callback URLs with the relevant provider:

```text
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/auth/linkedin/callback
```

Use the exact deployed HTTPS callbacks when running outside localhost.

## Demo limitations

- LinkedIn follower/post analytics use a demo-safe profile snapshot unless the provider returns those fields.
- Payouts, bank transfer, and Stripe Connect are deliberately not featured in this demo.
- No external AI/LLM API is used.
