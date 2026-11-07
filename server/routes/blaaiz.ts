import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { blaaizService } from '../services/blaaiz.js';
import { requireAuth, requireCompany } from '../middleware/auth.js';

export const blaaizRouter = Router();

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

// Provider callbacks use their own signature, not a CrewPay user session.
blaaizRouter.post('/webhook', (req: RawBodyRequest, res: Response) => {
  const secret = process.env.BLAAIZ_WEBHOOK_SECRET;
  const signature = req.header('x-blaaiz-signature');
  if (!secret || !signature || !req.rawBody) {
    return res.status(401).json({ error: 'Valid Blaaiz webhook signature required.' });
  }

  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const provided = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid Blaaiz webhook signature.' });
  }

  console.log('[Blaaiz Webhook Received]', {
    event: req.body?.event,
    transactionId: req.body?.transactionId,
    status: req.body?.status,
  });
  return res.json({ received: true });
});
blaaizRouter.use(requireAuth, requireCompany);

// Connection status & environment
blaaizRouter.get('/status', (req: Request, res: Response) => {
  return res.json(blaaizService.getConnectionStatus());
});

// Update credentials on the fly
blaaizRouter.post('/credentials', (req: Request, res: Response) => {
  const { clientId, clientSecret, environment } = req.body;
  if (typeof clientId !== 'string' || typeof clientSecret !== 'string' || !clientId.trim() || !clientSecret.trim()) {
    return res.status(400).json({ error: 'Client ID and Client Secret are required.' });
  }
  if (environment !== undefined && environment !== 'sandbox' && environment !== 'production') {
    return res.status(400).json({ error: 'Environment must be sandbox or production.' });
  }
  const status = blaaizService.updateCredentials(clientId, clientSecret, environment || 'sandbox');
  return res.json(status);
});

// Multi-currency treasury wallets & virtual bank accounts
blaaizRouter.get('/wallets', async (req: Request, res: Response) => {
  try {
    const wallets = await blaaizService.getWallets();
    return res.json({ wallets });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
// Quote calculation: FX rates, fee preview, and total debit (/rate & /fees)
blaaizRouter.post('/quote', async (req: Request, res: Response) => {
  try {
    const { fromCurrency, toCurrency, recipientsCount, totalToAmount } = req.body;
    const parsedRecipientsCount = Number(recipientsCount ?? 1);
    const parsedTotalToAmount = Number(totalToAmount);
    if (
      typeof fromCurrency !== 'string' ||
      typeof toCurrency !== 'string' ||
      !fromCurrency.trim() ||
      !toCurrency.trim() ||
      !Number.isInteger(parsedRecipientsCount) ||
      parsedRecipientsCount < 1 ||
      !Number.isFinite(parsedTotalToAmount) ||
      parsedTotalToAmount <= 0
    ) {
      return res.status(400).json({ error: 'fromCurrency, toCurrency, and totalToAmount are required.' });
    }

    const quote = await blaaizService.getQuote({
      fromCurrency: fromCurrency.trim().toUpperCase(),
      toCurrency: toCurrency.trim().toUpperCase(),
      recipientsCount: parsedRecipientsCount,
      totalToAmount: parsedTotalToAmount,
    });

    return res.json({ quote });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Execute payout batch using Blaaiz /payout
blaaizRouter.post('/payout', async (req: Request, res: Response) => {
  try {
    const { sourceCurrency, corridor, reference, narration, recipients } = req.body;
    const validRecipients = Array.isArray(recipients) && recipients.length > 0 && recipients.every((recipient) => (
      recipient &&
      typeof recipient.employeeId === 'string' &&
      typeof recipient.employeeName === 'string' &&
      typeof recipient.email === 'string' &&
      typeof recipient.accountNumber === 'string' &&
      typeof recipient.bankName === 'string' &&
      typeof recipient.routingCode === 'string' &&
      typeof recipient.targetCurrency === 'string' &&
      Number.isFinite(Number(recipient.amountLocal)) &&
      Number(recipient.amountLocal) > 0
    ));
    if (
      typeof sourceCurrency !== 'string' ||
      typeof corridor !== 'string' ||
      !sourceCurrency.trim() ||
      !corridor.trim() ||
      !validRecipients
    ) {
      return res.status(400).json({ error: 'Missing required payout batch fields or recipients.' });
    }

    const transaction = await blaaizService.executePayoutBatch({
      sourceCurrency: sourceCurrency.trim().toUpperCase(),
      corridor: corridor.trim().toUpperCase(),
      reference: typeof reference === 'string' ? reference.trim() : '',
      narration: typeof narration === 'string' ? narration.trim() : '',
      recipients: recipients.map((recipient: any) => ({
        ...recipient,
        targetCurrency: recipient.targetCurrency.trim().toUpperCase(),
        amountLocal: Number(recipient.amountLocal),
      })),
    });

    return res.json({ success: true, transaction });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Historical ledger transactions
blaaizRouter.get('/transactions', async (req: Request, res: Response) => {
  try {
    const transactions = await blaaizService.getTransactions();
    return res.json({ transactions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
