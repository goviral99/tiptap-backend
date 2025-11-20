const express = require("express");
const cors = require("cors");

// ⚠️ Hardcoded test key — replace with env var later
const stripe = require("stripe")(
  "sk_test_51P0AZgDwveEOLLlhfhGeLerlJHDcl6vh9sQe7srsCzDyWty3OGG4aJ1Mf7QyyoBdAMlg89SmA1UlA9gd3fcFWwZ2006vX3G7h8"
);

const app = express();
app.use(cors());

// ⭐ Parse BOTH JSON & form-data (required for Android demo)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------
// TEST ROUTES
// ------------------------
app.get("/", (req, res) => {
  res.send("Backend running OK");
});

app.post("/debug", (req, res) => {
  console.log("DEBUG BODY:", req.body);
  res.json(req.body);
});

// ------------------------
// STRIPE TERMINAL: Connection Token
// ------------------------
app.post("/connection_token", async (req, res) => {
  try {
    const token = await stripe.terminal.connectionTokens.create();
    res.json({ secret: token.secret });
  } catch (err) {
    console.error("CONNECTION TOKEN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// STRIPE TERMINAL: Create PaymentIntent
// ------------------------
app.post("/create_payment_intent", async (req, res) => {
  try {
    let { amount, currency } = req.body;

    console.log("REQUEST BODY RAW:", req.body);

    // Validate required field
    if (!amount) {
      return res.status(400).json({
        error: "Missing required parameter: amount",
      });
    }

    // Convert amount to integer cents
    if (typeof amount === "string") {
      amount = amount.replace("$", "").trim();
      amount = Math.round(parseFloat(amount) * 100); // convert dollars to cents
    }

    amount = parseInt(amount);

    console.log("AMOUNT IN CENTS:", amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || "cad",
      automatic_payment_methods: { enabled: true },
    });

    console.log("PAYMENT INTENT CREATED:", paymentIntent.id);

    // Return full PaymentIntent object (required for Stripe Terminal)
    res.json(paymentIntent);
  } catch (error) {
    console.error("STRIPE PI ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------
// START SERVER (Render auto-assigns PORT)
// ------------------------
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log("Server running on port " + port);
});
