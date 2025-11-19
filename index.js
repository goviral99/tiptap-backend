const express = require("express");
const cors = require("cors");

// ⚠️ Hardcoded (NOT SAFE) — replace YOUR_KEY_HERE with your real secret key.
const stripe = require("stripe")("sk_test_51P0AZgDwveEOLLlhfhGeLerlJHDcl6vh9sQe7srsCzDyWty3OGG4aJ1Mf7QyyoBdAMlg89SmA1UlA9gd3fcFWwZ2006vX3G7h8");

const app = express();
app.use(cors());
app.use(express.json());

// Test rout
app.get("/", (req, res) => {
    res.send("Backend running OK");
});

app.post("/debug", (req, res) => {
    console.log("DEBUG BODY:", req.body);
    res.json(req.body);
});


app.post("/create_payment_intent", async (req, res) => {
    try {
        const { amount, currency } = req.body;

        console.log("REQUEST BODY:", req.body);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency || "cad",
            automatic_payment_methods: { enabled: true }
        });

        console.log("RAW PAYMENT INTENT:", JSON.stringify(paymentIntent, null, 2));

        // FIX: return the correct key for Android
        res.json({ client_secret: paymentIntent.client_secret });

    } catch (error) {
        console.error("STRIPE ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

// Dynamic port for Render
const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log("Server running on port " + port);
});
