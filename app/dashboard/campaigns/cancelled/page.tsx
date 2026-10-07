import Link from "next/link";

export default function CampaignCancelledPage({
  searchParams,
}: {
  searchParams: { campaign?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl">
          …
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Payment cancelled
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          No charge was made. Your campaign is saved as a draft — you can
          launch it anytime from your dashboard for $29.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
