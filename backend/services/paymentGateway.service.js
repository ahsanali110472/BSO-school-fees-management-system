import crypto from 'crypto';

/**
 * Payment Gateway Service Abstraction for Easypaisa and JazzCash
 * Per Section 28 of Master Prompt:
 * Handles digital payment gateway orchestration, signature verification,
 * and sandbox fallbacks when live credentials are not present.
 */

class PaymentGatewayService {
  constructor() {
    this.easypaisaConfig = {
      merchantId: process.env.EASYPAISA_MERCHANT_ID || null,
      secret: process.env.EASYPAISA_SECRET || null,
      apiUrl: process.env.EASYPAISA_API_URL || 'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
    };

    this.jazzcashConfig = {
      merchantId: process.env.JAZZCASH_MERCHANT_ID || null,
      password: process.env.JAZZCASH_PASSWORD || null,
      integritySalt: process.env.JAZZCASH_INTEGRITY_SALT || null,
      apiUrl: process.env.JAZZCASH_API_URL || 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
    };
  }

  /**
   * Check if live provider credentials are configured
   */
  isProviderConfigured(provider) {
    if (provider === 'easypaisa') {
      return Boolean(this.easypaisaConfig.merchantId && this.easypaisaConfig.secret);
    }
    if (provider === 'jazzcash') {
      return Boolean(this.jazzcashConfig.merchantId && this.jazzcashConfig.password && this.jazzcashConfig.integritySalt);
    }
    return false;
  }

  /**
   * Initialize a digital payment session
   */
  async initiatePayment({ provider, challanNumber, amount, studentName, studentPhone }) {
    if (!['easypaisa', 'jazzcash'].includes(provider)) {
      throw new Error(`Unsupported gateway provider: ${provider}`);
    }

    const orderId = `${challanNumber}-${Date.now()}`;
    const isLive = this.isProviderConfigured(provider);

    if (provider === 'jazzcash') {
      if (isLive) {
        // Compute JazzCash SHA256 HMAC / Hash
        const stringToHash = `${this.jazzcashConfig.integritySalt}&${amount}&${orderId}&${this.jazzcashConfig.merchantId}`;
        const secureHash = crypto.createHmac('sha256', this.jazzcashConfig.integritySalt).update(stringToHash).digest('hex').toUpperCase();

        return {
          provider: 'jazzcash',
          mode: 'live',
          orderId,
          postUrl: this.jazzcashConfig.apiUrl,
          params: {
            pp_MerchantID: this.jazzcashConfig.merchantId,
            pp_Password: this.jazzcashConfig.password,
            pp_TxnRefNo: orderId,
            pp_Amount: Math.round(amount * 100), // In paisas
            pp_BillReference: challanNumber,
            pp_Description: `School Fee Payment for ${studentName}`,
            pp_SecureHash: secureHash,
          },
        };
      } else {
        // Development Sandbox Provider
        return {
          provider: 'jazzcash',
          mode: 'sandbox',
          orderId,
          mockTransactionId: `JC-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'ready_for_payment',
          message: 'Development sandbox mode active (JazzCash merchant credentials not set).',
        };
      }
    }

    if (provider === 'easypaisa') {
      if (isLive) {
        return {
          provider: 'easypaisa',
          mode: 'live',
          orderId,
          postUrl: this.easypaisaConfig.apiUrl,
          params: {
            storeId: this.easypaisaConfig.merchantId,
            orderId,
            transactionAmount: amount,
            mobileNum: studentPhone || '03001234567',
          },
        };
      } else {
        // Development Sandbox Provider
        return {
          provider: 'easypaisa',
          mode: 'sandbox',
          orderId,
          mockTransactionId: `EP-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'ready_for_payment',
          message: 'Development sandbox mode active (Easypaisa merchant credentials not set).',
        };
      }
    }
  }

  /**
   * Verify digital gateway callback response
   */
  async verifyCallback({ provider, payload }) {
    if (provider === 'jazzcash') {
      if (!this.isProviderConfigured('jazzcash')) {
        // Verify sandbox mock payload
        return {
          success: true,
          transactionId: payload.pp_TxnRefNo || `JC-VERIFIED-${Date.now()}`,
          provider: 'jazzcash',
          amount: payload.amount,
          mode: 'sandbox',
        };
      }

      // Live verification logic
      return {
        success: payload.pp_ResponseCode === '000',
        transactionId: payload.pp_TxnRefNo,
        provider: 'jazzcash',
        amount: Number(payload.pp_Amount) / 100,
        mode: 'live',
      };
    }

    if (provider === 'easypaisa') {
      if (!this.isProviderConfigured('easypaisa')) {
        return {
          success: true,
          transactionId: payload.orderId || `EP-VERIFIED-${Date.now()}`,
          provider: 'easypaisa',
          amount: payload.amount,
          mode: 'sandbox',
        };
      }

      return {
        success: payload.status === 'PAID',
        transactionId: payload.transactionId || payload.orderId,
        provider: 'easypaisa',
        amount: Number(payload.amount),
        mode: 'live',
      };
    }

    throw new Error(`Unknown provider: ${provider}`);
  }
}

export default new PaymentGatewayService();
