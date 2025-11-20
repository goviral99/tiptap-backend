const express = require("express");
const cors = require("cors");

const stripe = require("stripe")(
  "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"
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));   // 👈 required for Android form-urlencoded

// ---------------------------------------------------
// TEST ROUTES
// ---------------------------------------------------
app.get("/", (req, res) => {
  res.send("Backend running OK");
});

app.post("/debug", (req, res) => {
  console.log("DEBUG BODY:", req.body);
  res.json(req.body);
});

// ---------------------------------------------------
// STRIPE TERMINAL: Connection Token
// ---------------------------------------------------
app.post("/connection_token", async (req, res) => {
  try {
    const token = await stripe.terminal.connectionTokens.create();
    res.json({ secret: token.secret });
  } catch (err) {
    console.error("CONNECTION TOKEN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------
// STRIPE TERMINAL: Create Payment Intent
// (Configured EXACTLY as Stripe Tap-to-Pay Android expects)
// ---------------------------------------------------
app.post("/create_payment_intent", async (req, res) => {
  try {
    let { amount, currency } = req.body;

    console.log("REQUEST BODY RAW:", req.body);

    if (!amount) {
      return res.status(400).json({
        error: "Missing required parameter: amount",
      });
    }

    // Convert amount into integer cents
    if (typeof amount === "string") {
      amount = amount.replace("$", "").trim();
      amount = Math.round(parseFloat(amount) * 100);
    }

    amount = parseInt(amount);
    console.log("AMOUNT IN CENTS:", amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || "usd",
      automatic_payment_methods: { enabled: true },
    });

    console.log("PAYMENT INTENT CREATED:", paymentIntent.id);

    // ⭐ EXACT FORMAT the Android sample expects — prevents crashes ⭐
    res.json({
      client_secret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error("STRIPE PI ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------
// START SERVER (Render compatible)
// ---------------------------------------------------
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log("Server running on port " + port);
});
