/**
 * Blaaiz Platform API Client (Remittance-as-a-Service)
 * Handles OAuth 2.0 token caching, multi-currency wallets, virtual accounts,
 * fee/rate quotations, and cross-border payroll payouts.
 */

export interface BlaaizWallet {
  currency: string;
  name: string;
  balance: number;
  availableBalance: number;
  flag: string;
  symbol: string;
  virtualAccount?: {
    accountName: string;
    accountNumber: string;
    routingOrBic: string;
    bankName: string;
    country: string;
  };
}

export interface BlaaizQuoteRequest {
  fromCurrency: string;
  toCurrency: string;
  recipientsCount: number;
  totalToAmount: number;
}

export interface BlaaizQuoteResponse {
  fromCurrency: string;
  toCurrency: string;
  fxRate: number;
  subtotalFromAmount: number;
  fixedFee: number;
  networkFee: number;
  totalDebitFromAmount: number;
  guaranteedToAmount: number;
  quoteId: string;
  expiresInSeconds: number;
  settlementRail: string;
  estimatedArrival: string;
}

export interface BlaaizPayoutItem {
  employeeId: string;
  employeeName: string;
  email: string;
  accountNumber: string;
  bankName: string;
  routingCode: string;
  targetCurrency: string;
  amountLocal: number;
}

export interface BlaaizPayoutBatchRequest {
  sourceCurrency: string;
  corridor: string;
  reference: string;
  narration: string;
  recipients: BlaaizPayoutItem[];
}

export interface BlaaizTransactionRecord {
  id: string;
  reference: string;
  type: 'PAYROLL' | 'SWAP' | 'FUNDING';
  status: 'SUCCESSFUL' | 'PROCESSING' | 'PENDING';
  sourceCurrency: string;
  sourceAmount: number;
  targetCurrency: string;
  targetAmount: number;
  fxRate: number;
  recipientsCount: number;
  fee: number;
  recipientNames: string[];
  createdAt: string;
  settlementRail: string;
}

// In-memory persistent wallets for simulation
const mockWallets: BlaaizWallet[] = [
  {
    currency: 'USD',
    name: 'US Dollar Master Treasury',
    balance: 485900.50,
    availableBalance: 485900.50,
    flag: '🇺🇸',
    symbol: '$',
    virtualAccount: {
      accountName: 'Acme Global Operations Inc',
      accountNumber: '9840284719',
      routingOrBic: '021000021 (ACH/Wire)',
      bankName: 'JPMorgan Chase (Blaaiz Partner)',
      country: 'United States',
    },
  },
  {
    currency: 'EUR',
    name: 'Euro Treasury Pool',
    balance: 142350.00,
    availableBalance: 142350.00,
    flag: '🇪🇺',
    symbol: '€',
    virtualAccount: {
      accountName: 'Acme Global Operations Inc',
      accountNumber: 'LU89 3704 0044 0532 0130',
      routingOrBic: 'BLAAIZLUXX',
      bankName: 'Banking Circle (SEPA Rail)',
      country: 'Luxembourg',
    },
  },
  {
    currency: 'GBP',
    name: 'British Pound Disbursal Pool',
    balance: 95400.20,
    availableBalance: 95400.20,
    flag: '🇬🇧',
    symbol: '£',
    virtualAccount: {
      accountName: 'Acme Global Operations Inc',
      accountNumber: '83920194',
      routingOrBic: '40-47-84 (Faster Payments)',
      bankName: 'ClearBank (Blaaiz Partner)',
      country: 'United Kingdom',
    },
  },
  {
    currency: 'NGN',
    name: 'Nigerian Naira Operating Wallet',
    balance: 38500000.00,
    availableBalance: 38500000.00,
    flag: '🇳🇬',
    symbol: '₦',
    virtualAccount: {
      accountName: 'Acme Global - Blaaiz',
      accountNumber: '0829104821',
      routingOrBic: '058 (NIBSS Instant Payment)',
      bankName: 'Guaranty Trust Bank (Blaaiz Payout)',
      country: 'Nigeria',
    },
  },
];

const mockTransactions: BlaaizTransactionRecord[] = [
  {
    id: 'blz_tx_90184',
    reference: 'PAYROLL-2026-OCT-EUR',
    type: 'PAYROLL',
    status: 'SUCCESSFUL',
    sourceCurrency: 'USD',
    sourceAmount: 34500.00,
    targetCurrency: 'EUR',
    targetAmount: 31740.00,
    fxRate: 0.92,
    recipientsCount: 4,
    fee: 14.50,
    recipientNames: ['Lukas Müller', 'Elena Rostova', 'Sophie Dubois', 'Mateo Silva'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    settlementRail: 'SEPA Instant',
  },
  {
    id: 'blz_tx_90183',
    reference: 'PAYROLL-2026-OCT-GBP',
    type: 'PAYROLL',
    status: 'SUCCESSFUL',
    sourceCurrency: 'USD',
    sourceAmount: 18200.00,
    targetCurrency: 'GBP',
    targetAmount: 14378.00,
    fxRate: 0.79,
    recipientsCount: 2,
    fee: 8.20,
    recipientNames: ['Amara Okafor', 'Oliver Wright'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    settlementRail: 'Faster Payments',
  },
];

// Market Reference FX rates relative to USD
const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1465.0,
  CAD: 1.36,
  AUD: 1.54,
  KES: 132.5,
  GHS: 14.8,
};

export class BlaaizService {
  private clientId: string;
  private clientSecret: string;
  private environment: 'sandbox' | 'production' | 'simulation';
  private baseUrl: string;
  private cachedToken: { token: string; expiresAt: number } | null = null;
  private readonly requestTimeoutMs = 15_000;

  constructor() {
    this.clientId = process.env.BLAAIZ_CLIENT_ID || '';
    this.clientSecret = process.env.BLAAIZ_CLIENT_SECRET || '';
    const envSetting = (process.env.BLAAIZ_ENV || 'sandbox').toLowerCase();
    const configuredBaseUrl = process.env.BLAAIZ_BASE_URL?.replace(/\/$/, '');

    if (!this.clientId || !this.clientSecret) {
      this.environment = 'simulation';
      this.baseUrl = configuredBaseUrl || 'https://api-sandbox.blaaiz.com';
    } else if (envSetting === 'production') {
      this.environment = 'production';
      this.baseUrl = configuredBaseUrl || 'https://api-prod.blaaiz.com';
    } else {
      this.environment = 'sandbox';
      this.baseUrl = configuredBaseUrl || 'https://api-sandbox.blaaiz.com';
    }
  }

  public getConnectionStatus() {
    return {
      connected: this.environment !== 'simulation',
      environment: this.environment,
      hasCredentials: Boolean(this.clientId && this.clientSecret),
      baseUrl: this.baseUrl,
      mode: this.environment === 'simulation' ? 'Simulation (Active Sandbox Mock)' : `Live Blaaiz API (${this.environment})`,
    };
  }

  public updateCredentials(clientId: string, clientSecret: string, environment: 'sandbox' | 'production') {
    this.clientId = clientId.trim();
    this.clientSecret = clientSecret.trim();
    this.environment = environment;
    this.baseUrl = environment === 'production' ? 'https://api-prod.blaaiz.com' : 'https://api-sandbox.blaaiz.com';
    this.cachedToken = null;
    return this.getConnectionStatus();
  }

  /**
   * OAuth 2.0 Client Credentials Token Exchange
   */
  private async getAccessToken(): Promise<string> {
    if (this.environment === 'simulation') {
      return 'simulated_blaaiz_bearer_token';
    }

    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    const response = await this.request('/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      throw new Error('Blaaiz OAuth response did not contain an access token.');
    }

    const expiresIn = Number(data.expires_in) || 3600;
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(expiresIn - 60, 1) * 1000,
    };
    return this.cachedToken.token;
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    const headers = new Headers(init.headers);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Blaaiz request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`);
      }
      return response;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Blaaiz request timed out after ${this.requestTimeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async authenticatedRequest(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${await this.getAccessToken()}`);
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return this.request(path, { ...init, headers });
  }

  private static unwrap<T>(payload: any, key: string): T {
    return (payload?.[key] ?? payload?.data?.[key] ?? payload?.data ?? payload) as T;
  }

  /**
   * Get Multi-Currency Balances & Virtual Bank Accounts
   */
  public async getWallets(): Promise<BlaaizWallet[]> {
    if (this.environment !== 'simulation') {
      const response = await this.authenticatedRequest(process.env.BLAAIZ_WALLETS_PATH || '/wallets');
      const payload = await response.json();
      return BlaaizService.unwrap<BlaaizWallet[]>(payload, 'wallets');
    }
    return mockWallets;
  }

  /**
   * Calculate Real-Time FX and Transparent Fees (/fees and /rate)
   */
  public async getQuote(request: BlaaizQuoteRequest): Promise<BlaaizQuoteResponse> {
    const { fromCurrency, toCurrency, recipientsCount, totalToAmount } = request;

    if (this.environment !== 'simulation') {
      const response = await this.authenticatedRequest(process.env.BLAAIZ_QUOTE_PATH || '/quote', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      const payload = await response.json();
      return BlaaizService.unwrap<BlaaizQuoteResponse>(payload, 'quote');
    }

    // Calculate conversion
    const fromRate = FX_RATES_TO_USD[fromCurrency] || 1.0;
    const toRate = FX_RATES_TO_USD[toCurrency] || 1.0;

    // e.g. 1 USD = (toRate / fromRate) targetCurrency
    const fxRate = Number((toRate / fromRate).toFixed(4));

    // Subtotal from currency needed to deliver exact totalToAmount
    const subtotalFromAmount = Number((totalToAmount / fxRate).toFixed(2));

    // Transparent Fee Model
    const fixedFeePerRecipient = toCurrency === 'NGN' ? 0.50 : 2.50; // USD
    const networkFeeRate = 0.002; // 0.2%
    const fixedFee = Number((fixedFeePerRecipient * recipientsCount).toFixed(2));
    const networkFee = Number((subtotalFromAmount * networkFeeRate).toFixed(2));
    const totalDebitFromAmount = Number((subtotalFromAmount + fixedFee + networkFee).toFixed(2));

    let settlementRail = 'Local Bank Network';
    let estimatedArrival = 'Instant (under 2 minutes)';

    if (toCurrency === 'EUR') {
      settlementRail = 'SEPA Instant Credit Transfer';
      estimatedArrival = 'Instant (< 10 seconds)';
    } else if (toCurrency === 'GBP') {
      settlementRail = 'Faster Payments (FPS)';
      estimatedArrival = 'Instant (< 1 minute)';
    } else if (toCurrency === 'NGN') {
      settlementRail = 'NIBSS Instant Payments (NIP)';
      estimatedArrival = 'Instant (under 30 seconds)';
    } else if (toCurrency === 'USD') {
      settlementRail = 'ACH Same-Day / FedNow';
      estimatedArrival = 'Same-day settlement';
    }

    return {
      fromCurrency,
      toCurrency,
      fxRate,
      subtotalFromAmount,
      fixedFee,
      networkFee,
      totalDebitFromAmount,
      guaranteedToAmount: totalToAmount,
      quoteId: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      expiresInSeconds: 60,
      settlementRail,
      estimatedArrival,
    };
  }

  /**
   * Execute Batch Payroll or Single Payout via Blaaiz Payout API
   */
  public async executePayoutBatch(batch: BlaaizPayoutBatchRequest): Promise<BlaaizTransactionRecord> {
    if (!batch.sourceCurrency || !batch.corridor || !batch.recipients.length) {
      throw new Error('A source currency, target corridor, and at least one recipient are required.');
    }

    if (this.environment !== 'simulation') {
      const response = await this.authenticatedRequest(process.env.BLAAIZ_PAYOUT_PATH || '/payout', {
        method: 'POST',
        headers: {
          'Idempotency-Key': batch.reference || `crewpay-${Date.now()}`,
        },
        body: JSON.stringify(batch),
      });
      const payload = await response.json();
      return BlaaizService.unwrap<BlaaizTransactionRecord>(payload, 'transaction');
    }

    // Check wallet debit
    const sourceWallet = mockWallets.find((w) => w.currency === batch.sourceCurrency);
    const targetCurrency = batch.corridor;

    // Calculate total
    const totalToAmount = batch.recipients.reduce((sum, r) => sum + r.amountLocal, 0);
    const quote = await this.getQuote({
      fromCurrency: batch.sourceCurrency,
      toCurrency: targetCurrency,
      recipientsCount: batch.recipients.length,
      totalToAmount,
    });

    if (sourceWallet && sourceWallet.balance < quote.totalDebitFromAmount) {
      throw new Error(
        `Insufficient funds in ${batch.sourceCurrency} wallet. Required: ${quote.totalDebitFromAmount.toLocaleString()} ${batch.sourceCurrency}, Available: ${sourceWallet.balance.toLocaleString()} ${batch.sourceCurrency}`
      );
    }

    // Debit source wallet
    if (sourceWallet) {
      sourceWallet.balance = Number((sourceWallet.balance - quote.totalDebitFromAmount).toFixed(2));
      sourceWallet.availableBalance = sourceWallet.balance;
    }

    const tx: BlaaizTransactionRecord = {
      id: `blz_tx_${Date.now().toString().slice(-6)}`,
      reference: batch.reference || `PAYROLL-${Date.now().toString().slice(-4)}`,
      type: 'PAYROLL',
      status: 'SUCCESSFUL',
      sourceCurrency: batch.sourceCurrency,
      sourceAmount: quote.totalDebitFromAmount,
      targetCurrency,
      targetAmount: totalToAmount,
      fxRate: quote.fxRate,
      recipientsCount: batch.recipients.length,
      fee: quote.fixedFee + quote.networkFee,
      recipientNames: batch.recipients.map((r) => r.employeeName),
      createdAt: new Date().toISOString(),
      settlementRail: quote.settlementRail,
    };

    mockTransactions.unshift(tx);
    return tx;
  }

  /**
   * Retrieve Transaction History
   */
  public async getTransactions(): Promise<BlaaizTransactionRecord[]> {
    return mockTransactions;
  }
}

export const blaaizService = new BlaaizService();
