const express = require("express");
const cors = require("cors");

// Use Environment Variable
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// 1. Stripe Terminal Connection Token
app.post("/connection_token", async (req, res) => {
    try {
        const token = await stripe.terminal.connectionTokens.create();
        res.json({ secret: token.secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create Payment Intent
app.post("/create_payment_intent", async (req, res) => {
    try {
        const { amount } = req.body;

        const pi = await stripe.paymentIntents.create({
            amount,
            currency: "cad",
            payment_method_types: ["card_present", "interac_present"],
            capture_method: "manual"
        });

        res.json({
            id: pi.id,
            client_secret: pi.client_secret
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Capture Payment Intent
app.post("/capture_payment_intent", async (req, res) => {
    try {
        const { id } = req.body;
        const captured = await stripe.paymentIntents.capture(id);
        res.json(captured);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Backend running on port " + PORT));

