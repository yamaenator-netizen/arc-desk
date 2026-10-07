"use client";

import { useState } from "react";

export default function CopyLinkButton({ campaignId }: { campaignId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/c/${campaignId}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
    >
      {copied ? "Copied!" : "Copy signup link"}
    </button>
  );
}
