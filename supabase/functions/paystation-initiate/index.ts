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
    const { registration_id } = body;
    if (!registration_id) {
      return new Response(
        JSON.stringify({ error: "registration_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load registration with participant details
    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select(
        "id, registration_number, total_amount, participant:participants(full_name, email, mobile)"
      )
      .eq("id", registration_id)
      .maybeSingle();

    if (regErr || !reg) {
      return new Response(
        JSON.stringify({ error: "Registration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load PayStation settings from DB
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "paystation_env",
        "paystation_merchant_id",
        "paystation_password",
        "paystation_callback_url",
        "paystation_ipn_url",
      ]);

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

    // Determine URLs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const ipnUrl =
      settings.paystation_ipn_url ||
      `${supabaseUrl}/functions/v1/paystation-ipn`;
    const callbackUrl =
      settings.paystation_callback_url ||
      body.callback_url ||
      "";

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Create pending payment record
    const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error: payErr } = await supabase.from("payments").insert({
      registration_id: reg.id,
      transaction_id: txnId,
      invoice_number: invoiceNumber,
      payment_method: "PayStation",
      amount: reg.total_amount,
      gateway_charge: 0,
      status: "pending",
    });

    if (payErr) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment record: " + payErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build PayStation API URL
    const apiBase =
      env === "live"
        ? "https://payment.paystation.com.bd/payment"
        : "https://sandbox.paystation.com.bd/payment";

    const participant = reg.participant as { full_name: string; email: string; mobile: string };

    const formData = new URLSearchParams();
    formData.append("merchant_id", merchantId);
    formData.append("merchant_password", password);
    formData.append("invoice_number", invoiceNumber);
    formData.append("currency", "BDT");
    formData.append("amount", reg.total_amount.toString());
    formData.append("cus_name", participant.full_name || "");
    formData.append("cus_email", participant.email || "");
    formData.append("cus_phone", participant.mobile || "");
    formData.append("desc", `Golden Jubilee 2026 Registration - ${reg.registration_number}`);
    formData.append("ipn_url", ipnUrl);
    formData.append("success_url", callbackUrl ? `${callbackUrl}?status=success&reg=${reg.id}` : "");
    formData.append("cancel_url", callbackUrl ? `${callbackUrl}?status=cancelled&reg=${reg.id}` : "");
    formData.append("fail_url", callbackUrl ? `${callbackUrl}?status=failed&reg=${reg.id}` : "");

    // Call PayStation API
    const psResponse = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const psText = await psResponse.text();
    let psData: Record<string, unknown>;
    try {
      psData = JSON.parse(psText);
    } catch {
      // Update payment as failed
      await supabase
        .from("payments")
        .update({ status: "failed", gateway_response: psText })
        .eq("invoice_number", invoiceNumber);

      return new Response(
        JSON.stringify({ error: "Invalid response from PayStation", raw: psText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PayStation returns a payment_url on success
    if (psData.status === "success" || psData.payment_url) {
      // Update payment with processing status
      await supabase
        .from("payments")
        .update({ status: "processing", gateway_response: psText })
        .eq("invoice_number", invoiceNumber);

      return new Response(
        JSON.stringify({
          payment_url: psData.payment_url,
          invoice_number: invoiceNumber,
          registration_id: reg.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If PayStation returned an error
    await supabase
      .from("payments")
      .update({ status: "failed", gateway_response: psText })
      .eq("invoice_number", invoiceNumber);

    return new Response(
      JSON.stringify({
        error: (psData.message as string) || "Payment initiation failed",
        details: psData,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
