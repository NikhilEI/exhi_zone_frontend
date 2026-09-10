import { api } from "./apiClient";
import { showErrorAlert } from "./alerts";

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const CHECKOUT_SCRIPT_ID = "razorpay-checkout-js";
const BRAND_NAME = "Wellness India Expo 2027";
const BRAND_COLOR = "#696cff"; // --ez-primary

interface RazorpayCheckoutPayload {
  transactionId: number;
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderId: number;
  orderNumber: string;
  companyName: string;
  name: string;
  email: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: { description?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById(CHECKOUT_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = CHECKOUT_SCRIPT_ID;
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Kicks off a Razorpay payment for an existing (unpaid or partially paid) app
// order: creates a Razorpay order server-side, opens the Checkout.js modal,
// and on success verifies the payment signature server-side before treating
// it as paid. `onSettled` fires once with `true` (verified paid) or `false`
// (cancelled, failed, or gateway unavailable) so the caller can refresh its
// view — the order is authoritative in the database either way, this is just
// telling the UI when to re-fetch.
export async function payForOrder(orderId: number, onSettled: (paid: boolean) => void): Promise<void> {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    showErrorAlert("Could not load the payment gateway. Please check your connection and try again.");
    onSettled(false);
    return;
  }

  let payload: RazorpayCheckoutPayload;
  try {
    payload = await api.post<RazorpayCheckoutPayload>(`/payments/checkout/${orderId}`, undefined, {
      successMessage: "Opening secure payment…"
    });
  } catch (err) {
    // apiClient already showed the error toast (e.g. "Online payments are
    // not set up yet.") — nothing more to do here.
    void err;
    onSettled(false);
    return;
  }

  let settled = false;
  const settleOnce = (paid: boolean) => {
    if (settled) return;
    settled = true;
    onSettled(paid);
  };

  const razorpay = new window.Razorpay({
    key: payload.keyId,
    amount: payload.amount,
    currency: payload.currency,
    name: BRAND_NAME,
    description: `Payment for order ${payload.orderNumber}`,
    order_id: payload.razorpayOrderId,
    prefill: { name: payload.name, email: payload.email },
    notes: { orderNumber: payload.orderNumber },
    theme: { color: BRAND_COLOR },
    handler: (response) => {
      api
        .post("/payments/verify", {
          transactionId: payload.transactionId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
        .then(() => settleOnce(true))
        .catch((err: unknown) => {
          void err; // apiClient already surfaced the verification-failure toast
          settleOnce(false);
        });
    },
    modal: {
      ondismiss: () => settleOnce(false)
    }
  });

  razorpay.on("payment.failed", (response) => {
    showErrorAlert(response.error?.description || "Payment failed. Please try again.");
    settleOnce(false);
  });

  razorpay.open();
}
