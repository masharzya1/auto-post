# Required Vercel Environment Variables

To deploy this project successfully to Vercel, add these variables in your Vercel Project Settings:

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

**Why don't I need a Database URL?**
The app has been migrated to use **Firebase Firestore** exclusively. All data is stored in your Firebase project, so there is no need for a PostgreSQL database or a `DATABASE_URL`.
