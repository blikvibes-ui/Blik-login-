import { supabase } from 
"./supabaseClient"; export type Role = 
"user" | "admin"; export interface 
Profile {
  id: string; username: string; role: 
  Role; approved: boolean;
}
export interface PublicUser { id: 
  string; email: string; username: 
  string; role: Role; emailVerified: 
  boolean; approved: boolean;
}
export interface PendingUser { id: 
  string; username: string; email: 
  string; createdAt: string;
}
const GENERIC_ERROR = "Something went 
wrong. Please try again."; function 
friendlyAuthError(message: string | 
undefined): string {
  if (!message) return GENERIC_ERROR; if 
  (message.includes("Invalid login 
  credentials")) return "Invalid email 
  or password."; if 
  (message.includes("Email not 
  confirmed")) return "Please verify 
  your email before logging in."; if 
  (message.includes("FORBIDDEN")) return 
  "You do not have permission to do 
  that."; if 
  (message.includes("NOT_FOUND")) return 
  "No account found with that email."; 
  return message;
}
async function fetchProfile(userId: 
string): Promise<Profile | null> {
  const { data, error } = await supabase 
    .from("profiles") .select("id, 
    username, role, approved") .eq("id", 
    userId) .single();
  if (error || !data) return null; 
  return data as Profile;
}
export const authApi = { /** 
  Self-registration — no invite code 
  needed. New accounts start
   * unapproved; App.jsx shows a 
   "pending approval" screen until an 
   admin * approves them (see 
   approveUser below). */
  async register(input: { username: 
  string; email: string; password: 
  string }) {
    const { error } = await 
    supabase.auth.signUp({
      email: input.email, password: 
      input.password, options: {
        data: { username: input.username 
        },
      },
    });
    if (error) throw new 
    Error(friendlyAuthError(error.message)); 
    return { message: "Check your email 
    to verify your account. An admin 
    will approve it after that." };
  },
  async login(input: { email: string; 
  password: string }): 
  Promise<PublicUser> {
    const { data, error } = await 
    supabase.auth.signInWithPassword({
      email: input.email, password: 
      input.password,
    });
    if (error) throw new 
    Error(friendlyAuthError(error.message)); 
    if (!data.user) throw new 
    Error(GENERIC_ERROR); const profile 
    = await fetchProfile(data.user.id); 
    if (!profile) throw new 
    Error(GENERIC_ERROR); return {
      id: data.user.id, email: 
      data.user.email ?? input.email, 
      username: profile.username, role: 
      profile.role, emailVerified: 
      data.user.email_confirmed_at != 
      null, approved: profile.approved,
    };
  },
  async logout() { const { error } = 
    await supabase.auth.signOut(); if 
    (error) throw new 
    Error(GENERIC_ERROR); return { 
    message: "Logged out." };
  },
  async me(): Promise<PublicUser | null> 
  {
    const { data } = await 
    supabase.auth.getUser(); if 
    (!data.user) return null; const 
    profile = await 
    fetchProfile(data.user.id); if 
    (!profile) return null; return {
      id: data.user.id, email: 
      data.user.email ?? "", username: 
      profile.username, role: 
      profile.role, emailVerified: 
      data.user.email_confirmed_at != 
      null, approved: profile.approved,
    };
  },
  async resendVerification(email: 
  string) {
    const { error } = await 
    supabase.auth.resend({ type: 
    "signup", email }); if (error) throw 
    new Error(GENERIC_ERROR); return { 
    message: "If this account exists and 
    isn't verified yet, a new link has 
    been sent." };
  },
  /** Admin-only — the RPC itself checks 
  the caller's role server-side. */ 
  async listPendingUsers(): 
  Promise<PendingUser[]> {
    const { data, error } = await 
    supabase.rpc("list_pending_users"); 
    if (error) throw new 
    Error(friendlyAuthError(error.message)); 
    return (data ?? []).map((row: any) 
    => ({
      id: row.id, username: 
      row.username, email: row.email, 
      createdAt: row.created_at,
    }));
  },
  /** Admin-only — the RPC itself checks 
  the caller's role server-side. */ 
  async approveUser(targetEmail: string) 
  {
    const { error } = await 
    supabase.rpc("approve_user", { 
    target_email: targetEmail }); if 
    (error) throw new 
    Error(friendlyAuthError(error.message)); 
    return { message: `Approved 
    ${targetEmail}.` };
  },
  /** Admin-only — the RPC itself checks 
  the caller's role server-side. */ 
  async promoteToAdmin(targetEmail: 
  string) {
    const { error } = await 
    supabase.rpc("promote_to_admin", { 
    target_email: targetEmail }); if 
    (error) throw new 
    Error(friendlyAuthError(error.message)); 
    return { message: `Promoted 
    ${targetEmail} to admin.` };
  },
};
