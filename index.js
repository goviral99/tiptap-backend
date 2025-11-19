const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// 1. Create connection token
app.post("/connection_token", async (req, res) => {
    try {
        const token = await stripe.terminal.connectionTokens.create();
        res.json({ secret: token.secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create payment intent
app.post("/create_payment_intent", async (req, res) => {
    try {
        const { amount } = req.body;

        const pi = await stripe.paymentIntents.create({
            amount,
            currency: "cad",
            capture_method: "manual",
            payment_method_types: ["card_present", "interac_present"]
        });

        res.json({
            id: pi.id,
            client_secret: pi.client_secret
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Capture payment intent
app.post("/capture_payment_intent", async (req, res) => {
    try {
        const { id } = req.body;
        const captured = await stripe.paymentIntents.capture(id);
        res.json(captured);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(10000, () => {
    console.log("Backend running on port 10000");
});
