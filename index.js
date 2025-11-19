const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET || "sk_test_51P0AZgDwveEOLLlhfhGeLerlJHDcl6vh9sQe7srsCzDyWty3OGG4aJ1Mf7QyyoBdAMlg89SmA1UlA9gd3fcFWwZ2006vX3G7h8");  // fallback if needed

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Backend running OK");
});

// Create payment intent (Terminal / Tap to Pay)
app.post("/create_payment_intent", async (req, res) => {
    try {
        const { amount, currency } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency || "cad",
            automatic_payment_methods: { enabled: true }
        });

        res.json({ clientSecret: paymentIntent.client_secret });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// IMPORTANT: Render needs the dynamic port
const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log("Server running on port " + port);
});
