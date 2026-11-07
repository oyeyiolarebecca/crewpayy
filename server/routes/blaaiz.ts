import { Router, Request, Response } from 'express';
import { blaaizService } from '../services/blaaiz.js';

export const blaaizRouter = Router();

// Connection status & environment
blaaizRouter.get('/status', (req: Request, res: Response) => {
  return res.json(blaaizService.getConnectionStatus());
});

// Update credentials on the fly
blaaizRouter.post('/credentials', (req: Request, res: Response) => {
  const { clientId, clientSecret, environment } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Client ID and Client Secret are required.' });
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
    if (!fromCurrency || !toCurrency || !totalToAmount) {
      return res.status(400).json({ error: 'fromCurrency, toCurrency, and totalToAmount are required.' });
    }

    const quote = await blaaizService.getQuote({
      fromCurrency,
      toCurrency,
      recipientsCount: Number(recipientsCount) || 1,
      totalToAmount: Number(totalToAmount),
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
    if (!sourceCurrency || !corridor || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Missing required payout batch fields or recipients.' });
    }

    const transaction = await blaaizService.executePayoutBatch({
      sourceCurrency,
      corridor,
      reference,
      narration,
      recipients,
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

// Webhook listener for async status updates
blaaizRouter.post('/webhook', (req: Request, res: Response) => {
  console.log('[Blaaiz Webhook Received]:', req.body);
  return res.json({ received: true });
});
