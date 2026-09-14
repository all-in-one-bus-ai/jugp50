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

    // PayStation sends IPN as POST with form-encoded or JSON body
    let ipnData: Record<string, string> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      ipnData = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        ipnData[key] = value.toString();
      });
    } else {
      // Try JSON first, fall back to text parsing
      const text = await req.text();
      try {
        ipnData = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        params.forEach((value, key) => {
          ipnData[key] = value;
        });
      }
    }

    const invoiceNumber = ipnData.invoice_number || ipnData.invoiceNumber || "";
    const paymentStatus = (
      ipnData.payment_status ||
      ipnData.status ||
      ""
    ).toLowerCase();
    const spTransactionId = ipnData.sp_transaction_id || ipnData.transaction_id || "";

    if (!invoiceNumber) {
      return new Response(
        JSON.stringify({ error: "Missing invoice_number in IPN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the payment by invoice number
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("id, registration_id, status")
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    if (payErr || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found for invoice: " + invoiceNumber }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process if payment is still pending/processing
    if (payment.status === "paid") {
      return new Response(
        JSON.stringify({ message: "Payment already confirmed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optionally verify with PayStation API
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

    // Verify transaction with PayStation
    let verified = false;
    if (merchantId && password) {
      const verifyBase =
        env === "live"
          ? "https://payment.paystation.com.bd/transaction/verify"
          : "https://sandbox.paystation.com.bd/transaction/verify";

      const verifyForm = new URLSearchParams();
      verifyForm.append("merchant_id", merchantId);
      verifyForm.append("merchant_password", password);
      verifyForm.append("invoice_number", invoiceNumber);

      try {
        const verifyRes = await fetch(verifyBase, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: verifyForm.toString(),
        });
        const verifyData = await verifyRes.json();
        if (
          verifyData.status === "success" &&
          (verifyData.payment_status === "Completed" ||
            verifyData.payment_status === "completed" ||
            verifyData.payment_status === "COMPLETED")
        ) {
          verified = true;
        }
      } catch {
        // If verification API fails, fall back to IPN status
      }
    }

    // Determine final status from IPN or verification
    const isSuccess =
      verified ||
      paymentStatus === "completed" ||
      paymentStatus === "success" ||
      paymentStatus === "successful";

    const isCancelled =
      paymentStatus === "cancelled" || paymentStatus === "canceled";

    const newPaymentStatus = isSuccess
      ? "paid"
      : isCancelled
      ? "cancelled"
      : "failed";

    // Update payment record
    await supabase
      .from("payments")
      .update({
        status: newPaymentStatus,
        gateway_response: JSON.stringify(ipnData),
        paid_at: isSuccess ? new Date().toISOString() : null,
        transaction_id: spTransactionId || payment.id,
      })
      .eq("id", payment.id);

    // Update registration status
    if (isSuccess) {
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
    } else if (isCancelled) {
      await supabase
        .from("registrations")
        .update({ registration_status: "cancelled" })
        .eq("id", payment.registration_id);
    } else {
      await supabase
        .from("registrations")
        .update({ registration_status: "failed" })
        .eq("id", payment.registration_id);
    }

    return new Response(
      JSON.stringify({ message: "IPN processed", status: newPaymentStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
