"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import type { Role } from "@/app/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("author");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    if (!data.user) {
      setLoading(false);
      setError("Signup succeeded but no user was returned. Please log in.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      name: name || null,
      role,
    });
    setLoading(false);
    if (profileError) {
      setError(profileError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Create your ARC Desk account
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Free to start — run your first ARC campaign today.
        </p>
        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Your name or pen name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="text-sm font-medium">I am a…</label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              {(["author", "reader"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize ${
                    role === r
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Authors create campaigns. Readers sign up to review books.
            </p>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
