require("dotenv").config();
   const express = require("express");
   const cors = require("cors");

const app = express();
   app.use(express.json());
   app.use(cors({ origin: "http://localhost:5173" }));

const BASE_URL = "https://sandbox.cashfree.com/pg"; // use https://api.cashfree.com/pg for production

app.post("/create-order", async (req, res) => {
  const request = {
    order_id: "order_" + Date.now(),
    order_amount: 1.0,
    order_currency: "INR",
    customer_details: {
      customer_id: "cust_001",
      customer_phone: "9999999999",
      customer_email: "test@example.com",
    },
    order_meta: {
         return_url: "http://localhost:5173/?order_id={order_id}",
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json(data);
    }

    res.json({
      order_id: data.order_id,
      payment_session_id: data.payment_session_id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Order creation failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));