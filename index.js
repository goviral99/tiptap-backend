app.post("/create_payment_intent", async (req, res) => {
    try {
        let { amount, currency } = req.body;

        console.log("REQUEST BODY RAW:", req.body);

        if (!amount) {
            return res.status(400).json({
                error: "Missing required parameter: amount",
            });
        }

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

        // ⭐ FIX: return only what the Android sample expects ⭐
        res.json({
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret
        });

    } catch (error) {
        console.error("STRIPE PI ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});
