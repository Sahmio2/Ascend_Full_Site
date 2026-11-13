import crypto from 'node:crypto';

export const ASCEND_MONTHLY_PLAN_CODE = process.env.PAYSTACK_PLAN_CODE || 'PLN_ascend_monthly';
export const ASCEND_MONTHLY_PRICE_KOBO = 4000000; // ₦40,000 in kobo
export const ASCEND_CURRENCY = 'NGN';

export interface PaystackInitParams {
  email: string;
  amountKobo?: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  planCode?: string;
}

export interface PaystackVerifyResult {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'abandoned';
    paid_at: string;
    channel: string;
    customer: {
      id: number;
      customer_code: string;
      email: string;
    };
    plan?: string | null;
    subscription?: {
      subscription_code: string;
      email_token?: string;
    } | null;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Computes and verifies Paystack webhook signature over raw byte buffer.
 */
export function verifyPaystackWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | null | undefined
): boolean {
  if (!signatureHeader) return false;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return false;

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const hmac = crypto.createHmac('sha512', secretKey).update(bodyBuffer).digest('hex');

  try {
    const signatureBuffer = Buffer.from(signatureHeader, 'hex');
    const hmacBuffer = Buffer.from(hmac, 'hex');
    if (signatureBuffer.length !== hmacBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, hmacBuffer);
  } catch {
    return false;
  }
}

/**
 * Initializes a Paystack recurring subscription checkout.
 */
export async function initializePaystackCheckout(params: PaystackInitParams) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const amount = params.amountKobo || ASCEND_MONTHLY_PRICE_KOBO;

  // In test / simulation environment if secret key is not set or mock requested
  if (!secretKey || secretKey.startsWith('mock_') || process.env.NODE_ENV === 'test') {
    return {
      status: true,
      message: 'Checkout initialized (Simulated)',
      data: {
        authorization_url: `${params.callbackUrl || '/client/billing/callback'}?reference=${params.reference}&simulated=true`,
        access_code: `mock_acc_${crypto.randomBytes(8).toString('hex')}`,
        reference: params.reference,
      },
    };
  }

  const payload = {
    email: params.email,
    amount,
    currency: ASCEND_CURRENCY,
    reference: params.reference,
    plan: params.planCode || ASCEND_MONTHLY_PLAN_CODE,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  };

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Paystack initialization failed');
  }

  return data;
}

/**
 * Authoritatively verifies a transaction reference directly against Paystack.
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  // In test / simulation environment
  if (!secretKey || secretKey.startsWith('mock_') || process.env.NODE_ENV === 'test') {
    return {
      status: true,
      message: 'Verification successful (Simulated)',
      data: {
        id: 999999,
        reference,
        amount: ASCEND_MONTHLY_PRICE_KOBO,
        currency: ASCEND_CURRENCY,
        status: 'success',
        paid_at: new Date().toISOString(),
        channel: 'card',
        customer: {
          id: 1111,
          customer_code: 'CUS_mock12345',
          email: 'simulated@ascend.fitness',
        },
        plan: ASCEND_MONTHLY_PLAN_CODE,
        subscription: {
          subscription_code: 'SUB_mock12345',
          email_token: 'mock_token',
        },
      },
    };
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Paystack verification failed');
  }

  return data;
}

/**
 * Disables renewal for an active recurring subscription.
 */
export async function disablePaystackSubscription(subscriptionCode: string, emailToken?: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.startsWith('mock_') || process.env.NODE_ENV === 'test') {
    return { status: true, message: 'Subscription disabled (Simulated)' };
  }

  const response = await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });

  const data = await response.json();
  return data;
}
