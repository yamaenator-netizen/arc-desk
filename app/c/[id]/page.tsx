import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import ReaderSignupForm from "./ReaderSignupForm";
import type { Campaign } from "@/app/lib/types";

export default async function CampaignPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const campaign = data as Campaign;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id === campaign.author_id;

  const { count: approvedCount } = await supabase
    .from("signups")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("status", "approved");

  const spotsLeft = campaign.max_readers - (approvedCount ?? 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            ARC<span className="text-indigo-600">Desk</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[240px_1fr]">
          <div>
            {campaign.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaign.cover_url}
                alt={`${campaign.title} cover`}
                className="w-full rounded-xl shadow-lg"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-zinc-200 text-sm text-zinc-500">
                No cover yet
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
              {campaign.genre} · ARC campaign
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              {campaign.title}
            </h1>
            <p className="mt-1 text-lg text-zinc-600">
              by {campaign.author_name}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {campaign.start_date && (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                  Reviews from {campaign.start_date}
                </span>
              )}
              {campaign.end_date && (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                  Until {campaign.end_date}
                </span>
              )}
              <span
                className={`rounded-full px-3 py-1 ${
                  spotsLeft > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {spotsLeft > 0
                  ? `${spotsLeft} reviewer spots left`
                  : "Campaign full"}
              </span>
            </div>

            <p className="mt-6 whitespace-pre-line leading-relaxed text-zinc-700">
              {campaign.description}
            </p>

            <div className="mt-8">
              {!campaign.is_paid ? (
                isAuthor ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="text-sm font-semibold text-amber-900">
                      This campaign is a draft — readers see a &ldquo;coming
                      soon&rdquo; page until you launch it.
                    </p>
                    <Link
                      href="/dashboard"
                      className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Pay $29 to launch
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                    <p className="font-semibold text-zinc-900">
                      This campaign isn&apos;t live yet
                    </p>
                    <p className="mt-2 text-sm text-zinc-600">
                      The author hasn&apos;t opened reviewer signups. Check
                      back soon!
                    </p>
                  </div>
                )
              ) : spotsLeft > 0 ? (
                <ReaderSignupForm campaignId={campaign.id} />
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600">
                  This campaign has filled all reviewer spots. Check back for
                  the author&apos;s next book!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
