import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

export default async function CampaignSuccessPage({
  searchParams,
}: {
  searchParams: { campaign?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let title: string | null = null;
  if (searchParams.campaign) {
    const { data } = await supabase
      .from("campaigns")
      .select("title")
      .eq("id", searchParams.campaign)
      .eq("author_id", user.id)
      .single();
    title = data?.title ?? null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Payment complete — your campaign is live
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {title ? (
            <>
              <span className="font-semibold text-zinc-900">{title}</span> is
              now accepting reviewers.
            </>
          ) : (
            "Your campaign is now accepting reviewers."
          )}{" "}
          Share your signup link anywhere readers hang out.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Go to dashboard
          </Link>
          {searchParams.campaign && (
            <Link
              href={`/c/${searchParams.campaign}`}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:border-zinc-400"
            >
              View public campaign page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
