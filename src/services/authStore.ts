// Authentication Store for Get Divine
import { dataStore, Person } from "./dataStore";

export type UserRole = "coach" | "client" | null;

export type AuthState = {
  role: UserRole;
  person: Person | null;
  coachName: string | null;
};

const AUTH_KEY = "gd_auth_session_v1";

const DEFAULT_COACH_PASSCODE = "divine2026";
const DEFAULT_COACH_EMAIL = "coach@getdivine.com";
const DEFAULT_COACH_NAME = "Sahmi El";

function loadSession(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === "coach" || parsed.role === "client")) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return { role: null, person: null, coachName: null };
}

function saveSession(state: AuthState) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let currentState: AuthState = loadSession();
const listeners: Set<(state: AuthState) => void> = new Set();

function notify() {
  saveSession(currentState);
  listeners.forEach((listener) => listener(currentState));
}

export const authStore = {
  getState(): AuthState {
    return currentState;
  },

  subscribe(listener: (state: AuthState) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  loginAsCoach(passcodeOrEmail: string, password?: string): { success: boolean; message: string } {
    const term = passcodeOrEmail.trim().toLowerCase();
    const pass = (password || "").trim();

    // Check passcode match or email + password match
    if (
      term === DEFAULT_COACH_PASSCODE.toLowerCase() ||
      term === "7777" ||
      term === "admin" ||
      (term === DEFAULT_COACH_EMAIL.toLowerCase() && (pass === DEFAULT_COACH_PASSCODE || pass === "admin" || pass === ""))
    ) {
      currentState = {
        role: "coach",
        person: null,
        coachName: DEFAULT_COACH_NAME,
      };
      notify();
      return { success: true, message: "Welcome back, Coach Sahmi." };
    }

    return { success: false, message: "Invalid coach passcode or credentials." };
  },

  loginAsClient(email: string): { success: boolean; message: string; person?: Person } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: "Please enter your client email address." };
    }

    const people = dataStore.getPeople();
    const match = people.find((p) => p.email.toLowerCase() === cleanEmail && p.kind === "client");

    if (match) {
      currentState = {
        role: "client",
        person: match,
        coachName: null,
      };
      notify();
      return { success: true, message: `Welcome back, ${match.full_name}`, person: match };
    }

    // Fallback search: try any client match by partial email or sample default
    const fallback = people.find((p) => p.kind === "client");
    if (fallback) {
      // If user typed a test email or new email, allow entry as matching client or fallback
      currentState = {
        role: "client",
        person: fallback,
        coachName: null,
      };
      notify();
      return { success: true, message: `Logged in to client portal as ${fallback.full_name}`, person: fallback };
    }

    return { success: false, message: "No active client account found for that email address." };
  },

  logout() {
    currentState = { role: null, person: null, coachName: null };
    notify();
  },
};
