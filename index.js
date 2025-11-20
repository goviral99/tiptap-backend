const express = require("express");
const cors = require("cors");

const stripe = require("stripe")("sk_test_51P0AZgDwveEOLLlhfhGeLerlJHDcl6vh9sQe7srsCzDyWty3OGG4aJ1Mf7QyyoBdAMlg89SmA1UlA9gd3fcFWwZ2006vX3G7h8");

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Backend running OK");
});

// Debug route
app.post("/debug", (req, res) => {
    console.log("DEBUG BODY:", req.body);
    res.json(req.body);
});

// ⭐ REQUIRED FOR STRIPE TERMINAL ⭐
app.post("/connection_token", async (req, res) => {
    try {
        const token = await stripe.terminal.connectionTokens.create();
        res.json({ secret: token.secret });
    } catch (err) {
        console.error("CONNECTION TOKEN ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ⭐ FIXED: Create Payment Intent with proper amount parsing ⭐
app.post("/create_payment_intent", async (req, res) => {
    try {
        let { amount, currency } = req.body;

        console.log("REQUEST BODY RAW:", req.body);

        // Validate
        if (!amount) {
            return res.status(400).json({ error: "Missing required parameter: amount" });
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
            currency: currency || "cad",
            automatic_payment_methods: { enabled: true }
        });

        console.log("PAYMENT INTENT CREATED:", paymentIntent.id);

        // FIX: return full paymentIntent for Stripe Terminal
        res.json(paymentIntent);

    } catch (error) {
        console.error("STRIPE PI ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

// Render dynamic port
const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log("Server running on port " + port);
});
