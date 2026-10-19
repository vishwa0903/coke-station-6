import { useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";

export default function PayButton() {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3000/create-order", {
                method: "POST",
            });
            const data = await res.json();
            if (!data.payment_session_id) {
                alert("Could not create order");
                return;
            }

            const cashfree = await load({ mode: "sandbox" });
            if (!cashfree) {
                alert("Payment SDK failed to load");
                return;
            }
            await cashfree.checkout({
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_self",
            });
        } catch (err) {
            console.error(err);
            alert("Payment failed to start");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handlePay} disabled={loading}>
            {loading ? "Please wait..." : "Pay ₹1"}
        </button>
    );
}