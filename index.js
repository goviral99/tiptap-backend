const express = require("express");
const cors = require("cors");

// ⚠️ Use your LIVE secret key here
const stripe = require("stripe")("sk_live_XXXXXXX");

const app = express();

// Support CORS + JSON + Form Data
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your Tap-to-Pay / Terminal Location
const TERMINAL_LOCATION = "tml_GRmdEgU8lzCl89";

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

    // ⭐ REQUIRED FOR TAP-TO-PAY AND STRIPE TERMINAL
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
      // ⭐ REQUIRED FOR TAP-TO-PAY
      location: TERMINAL_LOCATION
    });

    console.log("Created PaymentIntent:", paymentIntent.id);

    // Return full PaymentIntent for Android SDK
    return res.json(paymentIntent);

  } catch (error) {
    console.error("PAYMENT INTENT ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------
// Capture PaymentIntent
// --------------------------------------------------
app.post("/capture_payment_intent", async (req, res) => {
  try {
    const { id } = req.body;
    const intent = await stripe.paymentIntents.capture(id);
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
    const intent = await stripe.paymentIntents.cancel(id);
    return res.json(intent);
  } catch (error) {
    console.error("CANCEL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
