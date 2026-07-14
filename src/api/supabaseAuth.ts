import { supabase } from "./supabaseClient";

export type Role = "user" | "admin";

export interface Profile {
  id: string;
  username: string;
  role: Role;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  emailVerified: boolean;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Maps Supabase's error strings to messages safe to show a user. Supabase
 * generally already avoids confirming/denying account existence on its own
 * (see docs/SETUP.md for the specifics we verified), so this mostly just
 * translates technical messages into plain language.
 */
function friendlyAuthError(message: string | undefined): string {
  if (!message) return GENERIC_ERROR;
  if (message.includes("Invalid login credentials")) return "Invalid email or password.";
  if (message.includes("Email not confirmed")) return "Please verify your email before logging in.";
  if (message.includes("INVITE_")) return "This invite code is invalid, already used, or expired.";
  if (message.toLowerCase().includes("database error saving new user")) {
    // The generic error Supabase returns when our handle_new_user trigger
    // rejects the signup (see the migration's comment on this limitation).
    // We only reach this if check_invite() raced and lost between the
    // pre-check and the actual signUp() call.
    return "This invite code is invalid, already used, or expired.";
  }
  return message;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

export const authApi = {
  /**
   * Pre-checks the invite code for a friendly error message, then calls
   * Supabase's signUp(). The database trigger (handle_new_user) is the real,
   * atomic enforcement — this pre-check only exists to avoid Supabase's
   * generic "Database error saving new user" message in the common case.
   */
  async register(input: { username: string; email: string; password: string; inviteCode: string }) {
    const { data: isValid, error: checkError } = await supabase.rpc("check_invite", {
      raw_code: input.inviteCode,
    });
    if (checkError) throw new Error(GENERIC_ERROR);
    if (!isValid) throw new Error("This invite code is invalid, already used, or expired.");

    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          username: input.username,
          invite_code: input.inviteCode,
        },
      },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    return { message: "Check your email to verify your account." };
  },

  async login(input: { email: string; password: string }): Promise<PublicUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (!data.user) throw new Error(GENERIC_ERROR);

    const profile = await fetchProfile(data.user.id);
    if (!profile) throw new Error(GENERIC_ERROR); // trigger should always have created one

    return {
      id: data.user.id,
      email: data.user.email ?? input.email,
      username: profile.username,
      role: profile.role,
      emailVerified: data.user.email_confirmed_at != null,
    };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(GENERIC_ERROR);
    return { message: "Logged out." };
  },

  async me(): Promise<PublicUser | null> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const profile = await fetchProfile(data.user.id);
    if (!profile) return null;
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      username: profile.username,
      role: profile.role,
      emailVerified: data.user.email_confirmed_at != null,
    };
  },

  async resendVerification(email: string) {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw new Error(GENERIC_ERROR);
    return { message: "If this account exists and isn't verified yet, a new link has been sent." };
  },

  /** Admin-only — the RPC itself checks the caller's role server-side. */
  async createInvite(expiresInHours = 168): Promise<{ inviteCode: string; expiresAt: string }> {
    const { data, error } = await supabase.rpc("create_invite", { expires_in_hours: expiresInHours });
    if (error) throw new Error(friendlyAuthError(error.message));
    const row = Array.isArray(data) ? data[0] : data;
    return { inviteCode: row.raw_code, expiresAt: row.expires_at };
  },

  /** Admin-only — the RPC itself checks the caller's role server-side. */
  async promoteToAdmin(targetEmail: string) {
    const { error } = await supabase.rpc("promote_to_admin", { target_email: targetEmail });
    if (error) throw new Error(friendlyAuthError(error.message));
    return { message: `Promoted ${targetEmail} to admin.` };
  },
};
