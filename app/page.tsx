import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Create your campaign",
    body: "Upload your cover and manuscript, set your genre, dates, and how many reviewers you want. Your campaign gets a public signup link in seconds.",
  },
  {
    n: "02",
    title: "Recruit reviewers",
    body: "Share your link anywhere — newsletter, socials, reader groups. Readers sign up with their name and email; you approve who gets the book.",
  },
  {
    n: "03",
    title: "Collect launch-day reviews",
    body: "Approved readers download the ARC and post their reviews. Track signups, approvals, and submitted reviews from one dashboard.",
  },
];

const faqs = [
  {
    q: "What is an ARC?",
    a: "An Advance Review Copy is a pre-release copy of your book given to readers in exchange for an honest review. Reviews posted in launch week are the single biggest driver of Amazon visibility for indie books.",
  },
  {
    q: "Do I need an existing audience?",
    a: "No. Your campaign page is a public link you can share anywhere — reader groups, newsletters, social media. ARC Desk handles the signup, approval, and tracking.",
  },
  {
    q: "Who owns the reviews?",
    a: "You do. Review links and text submitted through ARC Desk are visible in your dashboard, and reviewers post them on the retailers themselves.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold tracking-tight">
          ARC<span className="text-indigo-600">Desk</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 text-center sm:py-28">
          <p className="mb-4 inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            Built for indie authors
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Launch day reviews,
            <span className="text-indigo-600"> without the spreadsheet chaos</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            ARC Desk runs your Advance Review Copy campaign end to end: a public
            signup page for your book, one-click reader approvals, and a
            dashboard that tracks every review as launch day approaches.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700"
            >
              Start your first campaign
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-base font-semibold text-zinc-700 hover:border-zinc-400"
            >
              Log in
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-zinc-100 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
              >
                <div className="text-sm font-bold text-indigo-600">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-zinc-100 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600">
            One campaign, one price. Launch as many books as you want — you
            only pay when a campaign goes live.
          </p>
          <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-indigo-600 bg-white p-8 text-center shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Per campaign
            </p>
            <p className="mt-2 text-5xl font-bold tracking-tight">$29</p>
            <p className="mt-1 text-sm text-zinc-500">one-time · no subscription</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-zinc-700">
              <li>✓ Public signup page for your book</li>
              <li>✓ Unlimited reviewer signups</li>
              <li>✓ One-click approvals</li>
              <li>✓ Review tracking dashboard</li>
              <li>✓ Secure manuscript delivery</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700"
            >
              Start your first campaign
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-zinc-100 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">FAQ</h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-4">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-zinc-200 p-6"
              >
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <div className="rounded-3xl bg-indigo-600 px-6 py-14 text-white">
            <h2 className="text-3xl font-bold tracking-tight">
              Your next launch deserves more than hope.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-100">
              Set up your first ARC campaign in under five minutes and walk
              into launch day with reviews already lined up.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Create a free account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-500">
        ARC Desk — advance review copies, minus the chaos.
      </footer>
    </div>
  );
}
