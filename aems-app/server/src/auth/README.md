To integrate Auth.js (formerly NextAuth.js) with a custom frontend, you can follow these steps. Auth.js is primarily designed for Next.js, but you can adapt it for other frameworks or custom setups by using its REST API or JWT-based authentication. Here's a concise guide:

1. Set Up Auth.js Backend

Auth.js requires a backend to handle authentication. If you're using Next.js, this is straightforward. For other setups, you can create an API endpoint.

Example: Next.js API Route

```typescript
// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import Providers from "next-auth/providers";

export default NextAuth({
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
```

For non-Next.js backends, you can use Express.js or similar frameworks to replicate the Auth.js behavior.

2. Configure the Frontend

If you're using a custom frontend (e.g., React, Vue, or plain HTML/JS), you can interact with Auth.js via its REST API.

Example: Login Request

```typescript
const login = async () => {
  const response = await fetch("/api/auth/signin/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  console.log(data); // Handle tokens or redirect
};
```

Example: Fetch Session

```typescript
const fetchSession = async () => {
  const response = await fetch("/api/auth/session");
  const session = await response.json();
  console.log(session); // Contains user info if logged in
};
```

3. Use JWT for Stateless Authentication

If your frontend and backend are decoupled, enable JWT in Auth.js:

```typescript
export default NextAuth({
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    jwt: true,
  },
  callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session(session, token) {
      session.user.id = token.id;
      return session;
    },
  },
});
```

On the frontend, store the JWT securely (e.g., in httpOnly cookies or local storage) and include it in API requests.

4. Handle Authentication State

Use the session data to manage the user's authentication state on the frontend.

Example: React Context

```typescript
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      setUser(session?.user || null);
    };
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

5. Protect Routes

Redirect unauthenticated users or show conditional content based on the user's session.

Example: Protected Component

```typescript
import { useAuth } from "./AuthProvider";

const ProtectedPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <p>You must be logged in to view this page.</p>;
  }

  return <p>Welcome, {user.name}!</p>;
};
```

This approach ensures flexibility while integrating Auth.js with your custom frontend. Let me know if you'd like further clarification or examples!
