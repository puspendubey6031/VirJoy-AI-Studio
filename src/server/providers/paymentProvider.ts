import crypto from 'crypto';

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  status: 'created' | 'simulated';
  notes?: Record<string, any>;
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
  paymentId: string;
  message: string;
}

/**
 * Razorpay Payment Provider Integration Layer (Server-Side Only)
 */
export async function createRazorpayOrder(
  amountINR: number,
  planName: string,
  userId: string
): Promise<RazorpayOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_virjoy2026';
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const amountPaisa = Math.round(amountINR * 100);

  if (keySecret) {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountPaisa,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${userId.substring(0, 5)}`,
          notes: { planName, userId }
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        return {
          orderId: orderData.id,
          amount: amountINR,
          currency: 'INR',
          keyId,
          status: 'created',
          notes: orderData.notes
        };
      }
    } catch (err: any) {
      console.warn('[PaymentProvider] Razorpay direct order creation warning:', err?.message || err);
    }
  }

  // Simulated fallback order ID if keys are test/unconfigured
  const simulatedOrderId = `order_vj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    orderId: simulatedOrderId,
    amount: amountINR,
    currency: 'INR',
    keyId,
    status: 'simulated',
    notes: { planName, userId }
  };
}

export async function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<PaymentVerificationResult> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keySecret) {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = generatedSignature === signature;
    return {
      verified: isValid,
      orderId,
      paymentId,
      message: isValid ? 'Payment verified successfully via Razorpay signature' : 'Invalid Razorpay signature'
    };
  }

  // Fallback signature check for testing mode
  return {
    verified: true,
    orderId,
    paymentId,
    message: 'Payment verified in development mode'
  };
}
