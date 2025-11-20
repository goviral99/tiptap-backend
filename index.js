const express = require("express");
const cors = require("cors");

// ⚠️ Use your LIVE secret key here
const STRIPE_SECRET_KEY = "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";
const stripe = require("stripe")(STRIPE_SECRET_KEY);

const app = express();

// Support CORS + JSON + Form Data
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your Tap-to-Pay / Terminal Location (for reference/metadata)
const TERMINAL_LOCATION = "tml_GRw4dQPB9w96B1";

// --------------------------------------------------
// Health Check
// --------------------------------------------------
app.get("/", (req, res) => {
  res.send("Backend OK – Tap to Pay Android Enabled");
});

// --------------------------------------------------
// Create Connection Token (TTP + Readers)
// --------------------------------------------------
app.post("/connection_token", async (req, res) => {
  try {
    const token = await stripe.terminal.connectionTokens.create();
    return res.json({ secret: token.secret });
  } catch (error) {
    console.error("CONNECTION TOKEN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------
// Create PaymentIntent (Tap-to-Pay Android)
// --------------------------------------------------
app.post("/create_payment_intent", async (req, res) => {
  try {
    console.log("RAW BODY:", req.body);
    let { amount, currency } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: "Missing required parameter: amount" });
    }
    
    // Convert amounts to integer cents
    amount = parseInt(amount);
    if (isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    // ⭐ CREATE PAYMENT INTENT FOR TAP-TO-PAY
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || "cad",
      payment_method_types: ["card_present"],
      capture_method: "automatic",
      payment_method_options: {
        card_present: {
          request_extended_authorization: false,
          request_incremental_authorization_support: false
        }
      },
      // Optional: Store location in metadata for tracking
      metadata: {
        terminal_location: TERMINAL_LOCATION,
        source: "tap_to_pay_android"
      }
    });
    
    console.log("Created PaymentIntent:", paymentIntent.id);
    
    // Return full PaymentIntent for Android SDK
    return res.json(paymentIntent);
  } catch (error) {
    console.error("PAYMENT INTENT ERROR:", error);
    return res.status(500).json({ 
      error: error.message,
      details: error.raw ? error.raw : undefined 
    });
  }
});

// --------------------------------------------------
// Capture PaymentIntent
// --------------------------------------------------
app.post("/capture_payment_intent", async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: "Missing payment intent ID" });
    }
    
    const intent = await stripe.paymentIntents.capture(id);
    console.log("Captured PaymentIntent:", id);
    return res.json(intent);
  } catch (error) {
    console.error("CAPTURE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------
// Cancel PaymentIntent
// --------------------------------------------------
app.post("/cancel_payment_intent", async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: "Missing payment intent ID" });
    }
    
    const intent = await stripe.paymentIntents.cancel(id);
    console.log("Cancelled PaymentIntent:", id);
    return res.json(intent);
  } catch (error) {
    console.error("CANCEL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------
// Get PaymentIntent Status (Optional - helpful for debugging)
// --------------------------------------------------
app.get("/payment_intent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const intent = await stripe.paymentIntents.retrieve(id);
    return res.json(intent);
  } catch (error) {
    console.error("RETRIEVE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------
// List Recent Payments (Optional - helpful for debugging)
// --------------------------------------------------
app.get("/recent_payments", async (req, res) => {
  try {
    const payments = await stripe.paymentIntents.list({
      limit: 10,
      // Only show card_present payments
      query: 'payment_method_type:"card_present"'
    });
    return res.json(payments);
  } catch (error) {
    console.error("LIST ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Terminal Location: ${TERMINAL_LOCATION}`);
  console.log(`Environment: ${STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'}`);
});
