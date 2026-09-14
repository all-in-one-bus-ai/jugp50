import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { invoice_number } = body;

    if (!invoice_number) {
      return new Response(
        JSON.stringify({ error: "invoice_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the payment
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("id, registration_id, status, invoice_number")
      .eq("invoice_number", invoice_number)
      .maybeSingle();

    if (payErr || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already paid, return success immediately
    if (payment.status === "paid") {
      return new Response(
        JSON.stringify({
          status: "paid",
          registration_id: payment.registration_id,
          message: "Payment already confirmed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load PayStation settings
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["paystation_env", "paystation_merchant_id", "paystation_password"]);

    const settings: Record<string, string> = {};
    if (settingsRows) {
      for (const row of settingsRows) {
        settings[row.key] = row.value;
      }
    }

    const env = settings.paystation_env || "sandbox";
    const merchantId = settings.paystation_merchant_id || "";
    const password = settings.paystation_password || "";

    if (!merchantId || !password) {
      return new Response(
        JSON.stringify({ error: "PayStation credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call PayStation verification API
    const verifyBase =
      env === "live"
        ? "https://payment.paystation.com.bd/transaction/verify"
        : "https://sandbox.paystation.com.bd/transaction/verify";

    const verifyForm = new URLSearchParams();
    verifyForm.append("merchant_id", merchantId);
    verifyForm.append("merchant_password", password);
    verifyForm.append("invoice_number", invoice_number);

    const verifyRes = await fetch(verifyBase, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyForm.toString(),
    });

    const verifyText = await verifyRes.text();
    let verifyData: Record<string, unknown>;
    try {
      verifyData = JSON.parse(verifyText);
    } catch {
      return new Response(
        JSON.stringify({
          status: payment.status,
          registration_id: payment.registration_id,
          message: "Could not verify with PayStation",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentStatus = ((verifyData.payment_status as string) || "").toLowerCase();
    const isSuccess =
      paymentStatus === "completed" ||
      paymentStatus === "success" ||
      paymentStatus === "successful";
    const isCancelled =
      paymentStatus === "cancelled" || paymentStatus === "canceled";

    if (isSuccess) {
      // Confirm payment
      await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          gateway_response: verifyText,
          transaction_id: (verifyData.sp_transaction_id as string) || payment.id,
        })
        .eq("id", payment.id);

      await supabase
        .from("registrations")
        .update({ registration_status: "confirmed" })
        .eq("id", payment.registration_id);

      // Create ticket if not exists
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id")
        .eq("registration_id", payment.registration_id)
        .maybeSingle();

      if (!existingTicket) {
        const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        await supabase.from("tickets").insert({
          registration_id: payment.registration_id,
          ticket_id: ticketId,
          status: "active",
        });
      }

      return new Response(
        JSON.stringify({
          status: "paid",
          registration_id: payment.registration_id,
          message: "Payment verified and confirmed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isCancelled) {
      await supabase
        .from("payments")
        .update({ status: "cancelled", gateway_response: verifyText })
        .eq("id", payment.id);

      await supabase
        .from("registrations")
        .update({ registration_status: "cancelled" })
        .eq("id", payment.registration_id);
    }

    return new Response(
      JSON.stringify({
        status: isCancelled ? "cancelled" : payment.status,
        registration_id: payment.registration_id,
        message: isCancelled ? "Payment was cancelled" : "Payment not yet completed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
