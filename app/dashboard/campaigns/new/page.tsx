"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import { GENRES } from "@/app/lib/types";

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

export default function NewCampaignPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxReaders, setMaxReaders] = useState(100);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadFile(
    supabase: ReturnType<typeof createClient>,
    bucket: string,
    file: File
  ): Promise<string> {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });
    if (error) throw new Error(`Upload to ${bucket} failed: ${error.message}`);
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");

      let coverUrl: string | null = null;
      let bookFileUrl: string | null = null;
      if (coverFile) coverUrl = await uploadFile(supabase, "covers", coverFile);
      if (bookFile) bookFileUrl = await uploadFile(supabase, "books", bookFile);

      const { error: insertError } = await supabase.from("campaigns").insert({
        author_id: user.id,
        title,
        author_name: authorName,
        description,
        genre,
        cover_url: coverUrl,
        book_file_url: bookFileUrl,
        start_date: startDate || null,
        end_date: endDate || null,
        max_readers: maxReaders,
      });
      if (insertError) throw new Error(insertError.message);

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">New ARC campaign</h1>
        <p className="mt-1 text-zinc-600">
          Readers will see everything except your manuscript until you approve them.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-zinc-200 bg-white p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Book title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                placeholder="The Silent Meridian"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Author name *</label>
              <input
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={inputCls}
                placeholder="Your pen name"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description *</label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
              placeholder="The blurb readers see on your signup page…"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className={inputCls}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Review window opens</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Review window closes</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Max reviewers</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={maxReaders}
              onChange={(e) => setMaxReaders(Number(e.target.value))}
              className={inputCls}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Cover image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-zinc-600"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Shown publicly on your signup page.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Manuscript file</label>
              <input
                type="file"
                accept=".pdf,.epub,.mobi,.doc,.docx"
                onChange={(e) => setBookFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-zinc-600"
              />
              <p className="mt-1 text-xs text-zinc-500">
                PDF or EPUB. Only visible to approved readers.
              </p>
            </div>
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
            {loading ? "Creating campaign…" : "Create campaign"}
          </button>
        </form>
      </main>
    </div>
  );
}
