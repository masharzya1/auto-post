# Required Vercel Environment Variables

To deploy this project successfully to Vercel, add these variables in your Vercel Project Settings:

## Database (PostgreSQL)
- `DATABASE_URL`: Your PostgreSQL connection string.

## Security
- `SESSION_SECRET`: A random string (e.g., `openssl rand -base64 32`).

## Firebase Admin (Server-side)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID.
- `FIREBASE_CLIENT_EMAIL`: Your Firebase service account email.
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key (ensure newlines `\n` are preserved).

## Firebase Client (Frontend)
- `VITE_FIREBASE_API_KEY`: Your Firebase API key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain.
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID.
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase sender ID.
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID.

---

### FAQ

**Why do I need AI_INTEGRATIONS_OPENAI_API_KEY?**
This is a fallback key. The app allows users to provide their own keys in the **Settings** page, which are stored in the database. If a user provides their own key, the app will use it. The environment variable is only used if no user key is available.

**Why do I need DATABASE_URL if I use Firebase?**
Firebase is used for **Authentication** (user identity). However, the app uses **PostgreSQL** to store:
- User metadata and session links.
- Application settings (API keys, niche, posting frequency).
- AI Usage limits and tracking.
- Workflow configurations and content history.
Firebase handles who the user is; PostgreSQL handles what the app does for them.