"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

export default function ReaderSignupForm({ campaignId }: { campaignId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("signups").insert({
      campaign_id: campaignId,
      reader_id: user?.id ?? null,
      name: name || null,
      email,
      status: "pending",
    });

    if (error) {
      setStatus("error");
      setMessage(
        error.message.includes("duplicate")
          ? "This email has already signed up for this campaign."
          : error.message
      );
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <h3 className="font-semibold text-green-900">You&apos;re on the list!</h3>
        <p className="mt-1 text-sm text-green-800">
          The author will review your request. If approved, you&apos;ll get
          access to the ARC — keep an eye on your inbox.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6"
    >
      <h3 className="font-semibold">Request a review copy</h3>
      <p className="mt-1 text-sm text-zinc-600">
        Free for reviewers — the author approves each request.
      </p>
      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      {status === "error" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {status === "loading" ? "Signing up…" : "Request ARC"}
      </button>
    </form>
  );
}
