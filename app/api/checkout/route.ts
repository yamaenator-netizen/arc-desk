import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/app/lib/supabase/server";

const PRICE_USD_CENTS = 2900; // $29 per campaign, one-time

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return NextResponse.json(
        { error: "campaign_id is required." },
        { status: 400 }
      );
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("id, title, is_paid")
      .eq("id", campaign_id)
      .eq("author_id", user.id)
      .single();

    if (error || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found." },
        { status: 404 }
      );
    }
    if (campaign.is_paid) {
      return NextResponse.json(
        { error: "This campaign is already paid." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: PRICE_USD_CENTS,
            product_data: { name: "ARC Desk campaign launch" },
          },
          quantity: 1,
        },
      ],
      metadata: { campaign_id: campaign.id },
      success_url: `${origin}/dashboard/campaigns/success?campaign=${campaign.id}`,
      cancel_url: `${origin}/dashboard/campaigns/cancelled?campaign=${campaign.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 }
    );
  }
}
