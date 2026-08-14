// /api/verify.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ status: false, message: 'Missing reference' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set in environment variables');
    return res.status(500).json({ status: false, message: 'Server not configured' });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = await paystackRes.json();

    if (!data.status || !data.data) {
      return res.status(200).json({ status: false, message: 'Verification failed', raw: data });
    }

    const tx = data.data;
    const genuinelyPaid = tx.status === 'success';

    console.log('PAYSTACK_VERIFY', JSON.stringify({
      reference: tx.reference,
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      customer_email: tx.customer?.email,
      metadata: tx.metadata,
      paid_at: tx.paid_at,
    }));

    return res.status(200).json({
      status: genuinelyPaid,
      amount: tx.amount,
      currency: tx.currency,
      email: tx.customer?.email,
      reference: tx.reference,
      paid_at: tx.paid_at,
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ status: false, message: 'Verification request failed' });
  }
}
