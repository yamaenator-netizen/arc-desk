import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import CopyLinkButton from "./CopyLinkButton";
import type { Campaign, Signup } from "@/app/lib/types";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const list: Campaign[] = campaigns ?? [];

  // Signup counts per campaign
  const counts: Record<string, { total: number; approved: number }> = {};
  if (list.length > 0) {
    const { data: signups } = await supabase
      .from("signups")
      .select("campaign_id, status")
      .in(
        "campaign_id",
        list.map((c) => c.id)
      );
    (signups as Pick<Signup, "campaign_id" | "status">[] | null)?.forEach(
      (s) => {
        counts[s.campaign_id] ??= { total: 0, approved: 0 };
        counts[s.campaign_id].total += 1;
        if (s.status === "approved") counts[s.campaign_id].approved += 1;
      }
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight">
            ARC<span className="text-indigo-600">Desk</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600">
              {profile?.name || user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Your campaigns
            </h1>
            <p className="mt-1 text-zinc-600">
              Create a campaign, share the link, and watch the reviews come in.
            </p>
          </div>
          <Link
            href="/dashboard/campaigns/new"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + New campaign
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold">No campaigns yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              Your first ARC campaign takes about five minutes to set up: a
              title, a cover, your manuscript, and a public signup link.
            </p>
            <Link
              href="/dashboard/campaigns/new"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => {
              const stat = counts[c.id] ?? { total: 0, approved: 0 };
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-6"
                >
                  <div className="flex gap-4">
                    {c.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.cover_url}
                        alt={`${c.title} cover`}
                        className="h-24 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-16 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
                        No cover
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{c.title}</h2>
                      <p className="text-sm text-zinc-500">{c.genre}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {stat.total} signups · {stat.approved} approved
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/c/${c.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
                    >
                      View public page
                    </Link>
                    <CopyLinkButton campaignId={c.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
