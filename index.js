const express = require("express");
const cors = require("cors");
const stripe = require("stripe")("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"); // <- your LIVE SECRET KEY

const app = express();
app.use(cors());
app.use(express.json());

// Your Terminal Location
const TERMINAL_LOCATION = "tml_GRmdEgU8lzCl89";

// --------------------------
// Test route
// --------------------------
app.get("/", (req, res) => {
  res.send("Backend OK – Tap to Pay Enabled");
});

// --------------------------
// Terminal: Connection Token
// --------------------------
app.post("/connection_token", async (req, res) => {
  try {
    const token = await stripe.terminal.connectionTokens.create();
    res.json({ secret: token.secret });
  } catch (err) {
    console.error("CONNECTION TOKEN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------
// Terminal: Create PaymentIntent
// --------------------------
app.post("/create_payment_intent", async (req, res) => {
  try {
    let { amount, currency } = req.body;

    console.log("RAW BODY:", req.body);

    if (!amount) {
      return res.status(400).json({ error: "Missing amount" });
    }

    // Convert to integer cents
    amount = parseInt(amount);
    if (isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // REQUIRED FOR TAP-TO-PAY AND CARD_PRESENT
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
      // REQUIRED FOR TTP
      location: TERMINAL_LOCATION
    });

    console.log("Created PI:", paymentIntent.id);

    // The Android SDK expects the **full PaymentIntent object**
    res.json(paymentIntent);

  } catch (error) {
    console.error("PI ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// --------------------------
// Terminal: Capture
// --------------------------
app.post("/capture_payment_intent", async (req, res) => {
  try {
    const { id } = req.body;
    const intent = await stripe.paymentIntents.capture(id);
    res.json(intent);
  } catch (err) {
    console.error("CAPTURE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------
// Terminal: Cancel
// --------------------------
app.post("/cancel_payment_intent", async (req, res) => {
  try {
    const { id } = req.body;
    const intent = await stripe.paymentIntents.cancel(id);
    res.json(intent);
  } catch (err) {
    console.error("CANCEL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------
// Start server
// --------------------------
const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port", port));
