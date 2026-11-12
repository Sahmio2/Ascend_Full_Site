// Authentication Store for Get Divine
import { dataStore, Person } from "./dataStore";

export type UserRole = "coach" | "client" | null;
export type AuthMode = "live" | "demo";

export type AuthSession = {
  role: UserRole;
  mode: AuthMode;
  clientEmail?: string;
  clientId?: string;
  clientName?: string;
  coachName?: string;
};

export type AuthState = {
  role: UserRole;
  mode: AuthMode;
  person: Person | null;
  coachName: string | null;
  clientEmail?: string;
  clientName?: string;
};

const AUTH_KEY = "gd_auth_session_v1";

const DEFAULT_COACH_PASSCODE = "divine2026";
const DEFAULT_COACH_EMAIL = "coach@ascend.co";
const LEGACY_COACH_EMAIL = "coach@getdivine.com";
const DEFAULT_COACH_NAME = "Sahmi El";

function loadSession(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === "coach" || parsed.role === "client")) {
        return {
          ...parsed,
          mode: parsed.mode || "live",
        };
      }
    }
  } catch {
    // fallback
  }
  return { role: null, mode: "live", person: null, coachName: null };
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

  getSession(): AuthSession {
    return {
      role: currentState.role,
      mode: currentState.mode || "live",
      clientEmail: currentState.clientEmail || currentState.person?.email,
      clientName: currentState.clientName || currentState.person?.full_name,
      coachName: currentState.coachName || undefined,
    };
  },

  setSession(session: Partial<AuthSession>) {
    currentState = {
      ...currentState,
      role: session.role !== undefined ? session.role : currentState.role,
      mode: session.mode || currentState.mode || "live",
      clientEmail: session.clientEmail || currentState.clientEmail,
      clientName: session.clientName || currentState.clientName,
      coachName: session.coachName || currentState.coachName,
    };
    notify();
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

    if (
      term === DEFAULT_COACH_PASSCODE.toLowerCase() ||
      term === "ascend2026" ||
      term === "7777" ||
      term === "admin" ||
      ((term === DEFAULT_COACH_EMAIL.toLowerCase() || term === LEGACY_COACH_EMAIL.toLowerCase()) &&
        (pass === DEFAULT_COACH_PASSCODE || pass === "ascend2026" || pass === "admin" || pass === ""))
    ) {
      currentState = {
        role: "coach",
        mode: "live",
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
        mode: "live",
        person: match,
        clientEmail: match.email,
        clientName: match.full_name,
        coachName: null,
      };
      notify();
      return { success: true, message: `Welcome back, ${match.full_name}`, person: match };
    }

    const fallback = people.find((p) => p.kind === "client");
    if (fallback) {
      currentState = {
        role: "client",
        mode: "live",
        person: fallback,
        clientEmail: fallback.email,
        clientName: fallback.full_name,
        coachName: null,
      };
      notify();
      return { success: true, message: `Logged in to client portal as ${fallback.full_name}`, person: fallback };
    }

    return { success: false, message: "No active client account found for that email address." };
  },

  logout() {
    currentState = { role: null, mode: "live", person: null, coachName: null };
    notify();
  },
};
