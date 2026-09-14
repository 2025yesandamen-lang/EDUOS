import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();
// Request Gmail Scopes
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.compose");
provider.addScope("https://www.googleapis.com/auth/gmail.modify");

// Force account selection to avoid auto-login with wrong accounts
provider.setCustomParameters({
  prompt: "select_account"
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Helper: check if running inside embedded preview iframe
export const isIframeEnvironment = (): boolean => {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Initialize Auth State Listener
export const initGmailAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Read any cached session from session memory (or prompt on fresh flow)
  const sessionToken = sessionStorage.getItem("cbt_gmail_access_token");
  const sessionUser = sessionStorage.getItem("cbt_gmail_user");

  if (sessionToken && sessionUser) {
    try {
      const parsedUser = JSON.parse(sessionUser);
      cachedAccessToken = sessionToken;
      if (onAuthSuccess) onAuthSuccess(parsedUser, sessionToken);
    } catch (e) {
      // Fall through to Firebase auth listener
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      const adminToken = sessionStorage.getItem("cbt_gmail_access_token");
      if (adminToken && adminToken.startsWith("cbt_admin_")) {
        // Active school admin session
        const rawUser = sessionStorage.getItem("cbt_gmail_user");
        if (rawUser && onAuthSuccess) {
          onAuthSuccess(JSON.parse(rawUser), adminToken);
          return;
        }
      }
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in via Google popup to get Gmail access token
export const signInWithGmail = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token from authentication result.");
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem("cbt_gmail_access_token", cachedAccessToken);
    sessionStorage.setItem("cbt_gmail_user", JSON.stringify({
      displayName: result.user.displayName || "Admin",
      email: result.user.email,
      photoURL: result.user.photoURL
    }));
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Gmail authorization error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Quick-connect using School Admin Profile (resilient in iframe environments)
export const signInWithSchoolAdminProfile = (adminEmail: string = "omoobarich@gmail.com"): { user: any; accessToken: string } => {
  const token = `cbt_admin_${Date.now()}`;
  const user = {
    displayName: "School Administrator",
    email: adminEmail,
    photoURL: ""
  };
  cachedAccessToken = token;
  sessionStorage.setItem("cbt_gmail_access_token", token);
  sessionStorage.setItem("cbt_gmail_user", JSON.stringify(user));
  return { user, accessToken: token };
};

// Log out and clear cached token
export const logoutGmail = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    // ignore
  }
  cachedAccessToken = null;
  sessionStorage.removeItem("cbt_gmail_access_token");
  sessionStorage.removeItem("cbt_gmail_user");
};

// Helper: base64url encoding for MIME messages
const base64urlEncode = (str: string) => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// Send an Email via Gmail API or School Dispatcher
export const sendGmailMessage = async (
  token: string,
  to: string,
  subject: string,
  bodyHtml: string
): Promise<any> => {
  // If connected via School Admin Dispatcher Relay
  if (token.startsWith("cbt_admin_")) {
    const res = await fetch("/api/gmail/send-dispatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("cbt_auth_token") || localStorage.getItem("cbt_token") || ""}`
      },
      body: JSON.stringify({ to, subject, bodyHtml })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to dispatch email via school mail node.");
    }
    return res.json();
  }

  // Standard Google Gmail API endpoint
  const mimeParts = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    bodyHtml
  ];
  
  const mimeMessage = mimeParts.join("\r\n");
  const rawMessage = base64urlEncode(mimeMessage);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: rawMessage })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to send email via Gmail API.");
  }

  return res.json();
};

// Fetch Gmail Messages
export const listGmailMessages = async (token: string, maxResults = 15): Promise<any[]> => {
  // If School Admin Dispatcher
  if (token.startsWith("cbt_admin_")) {
    try {
      const res = await fetch("/api/gmail/messages", {
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("cbt_auth_token") || localStorage.getItem("cbt_token") || ""}`
        }
      });
      if (res.ok) {
        const records = await res.json();
        return records.map((r: any) => ({
          id: r.id,
          snippet: r.body.replace(/<[^>]*>?/gm, "").slice(0, 120) + "...",
          payload: {
            headers: [
              { name: "Subject", value: r.subject },
              { name: "From", value: r.from },
              { name: "To", value: r.to },
              { name: "Date", value: new Date(r.sentAt).toLocaleString() }
            ],
            body: {
              data: btoa(unescape(encodeURIComponent(r.body)))
            }
          }
        }));
      }
    } catch (e) {
      console.error("Error fetching school dispatch messages:", e);
    }
    return [];
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to retrieve messages from Gmail.");
  }

  const data = await res.json();
  if (!data.messages) return [];

  // Fetch detail for each message in parallel
  const messageDetails = await Promise.all(
    data.messages.map(async (msg: { id: string }) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (detailRes.ok) {
          return detailRes.json();
        }
      } catch (e) {
        console.error("Error fetching message detail:", e);
      }
      return null;
    })
  );

  return messageDetails.filter(msg => msg !== null);
};

// Parse email header values
export const getHeaderValue = (headers: any[], name: string): string => {
  const header = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : "";
};

// Simple MIME body decoder
export const decodeEmailBody = (payload: any): string => {
  if (!payload) return "";
  
  // If text or html is directly in the payload body
  if (payload.body?.data) {
    try {
      return decodeURIComponent(
        escape(atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/")))
      );
    } catch (e) {
      return "";
    }
  }

  // If nested in parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const decoded = decodeEmailBody(part);
      if (decoded) return decoded;
    }
  }

  return "";
};
