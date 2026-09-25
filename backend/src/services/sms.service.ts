export interface SmsSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  simulated?: boolean;
}

export class SmsService {
  /**
   * Dispatches a 6-digit OTP code to the given recipient via Twilio or Fast2SMS.
   * If credentials are not configured or set to placeholders, safely falls back
   * to server console logging without failing the request.
   */
  public async sendOtp(toPhone: string, otpCode: string): Promise<SmsSendResult> {
    const fastKey = process.env.FAST2SMS_API_KEY;
    const fastConfigured = fastKey && !fastKey.includes('your_') && fastKey.trim().length > 10;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioConfigured = twilioSid && !twilioSid.includes('your_') && twilioSid.trim().length > 10;

    const requestedProvider = (process.env.SMS_PROVIDER || '').toLowerCase();
    const useFast2SMS = requestedProvider === 'fast2sms' || (fastConfigured && !twilioConfigured);

    const message = `Your Open-World Electronics Lab verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code with anyone.`;

    if (useFast2SMS) {
      return this.sendViaFast2SMS(toPhone, otpCode, message);
    } else {
      return this.sendViaTwilio(toPhone, otpCode, message);
    }
  }

  private async sendViaTwilio(toPhone: string, otpCode: string, message: string): Promise<SmsSendResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const isConfigured =
      accountSid &&
      authToken &&
      fromNumber &&
      !accountSid.includes('your_') &&
      !authToken.includes('your_') &&
      !fromNumber.includes('your_');

    if (!isConfigured) {
      console.log(`\n========================================================================`);
      console.log(`📱 [SMS DISPATCH - DEV SIMULATION MODE] (Provider: Twilio)`);
      console.log(`To: ${toPhone}`);
      console.log(`OTP Code: ${otpCode}`);
      console.log(`Message: "${message}"`);
      console.log(`ℹ️ Notice: Set live TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env for live cellular dispatch.`);
      console.log(`========================================================================\n`);

      return {
        success: true,
        provider: 'twilio (simulated)',
        simulated: true,
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', toPhone);
      params.append('From', fromNumber);
      params.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data: any = await response.json();

      if (!response.ok) {
        console.error('Twilio SMS API Error:', data);
        throw new Error(data.message || 'Failed to dispatch SMS via Twilio');
      }

      console.log(`[Twilio SMS] Dispatched successfully to ${toPhone}. SID: ${data.sid}`);
      return {
        success: true,
        provider: 'twilio',
        messageId: data.sid,
      };
    } catch (err: any) {
      console.error('Twilio SMS dispatch exception:', err.message);
      console.log(`[FALLBACK SMS OTP for ${toPhone}]: ${otpCode}`);
      return {
        success: true,
        provider: 'twilio (fallback)',
        simulated: true,
      };
    }
  }

  private async sendViaFast2SMS(toPhone: string, otpCode: string, message: string): Promise<SmsSendResult> {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const isConfigured = apiKey && !apiKey.includes('your_') && apiKey.trim().length > 10;

    // Clean phone number (remove +, spaces, country code if 91 is included)
    let cleanNumber = toPhone.replace(/\D/g, '');
    if (cleanNumber.startsWith('91') && cleanNumber.length > 10) {
      cleanNumber = cleanNumber.slice(2);
    }

    if (!isConfigured) {
      console.log(`\n========================================================================`);
      console.log(`📱 [SMS DISPATCH - DEV SIMULATION MODE] (Provider: Fast2SMS)`);
      console.log(`To: ${toPhone} (${cleanNumber})`);
      console.log(`OTP Code: ${otpCode}`);
      console.log(`Message: "${message}"`);
      console.log(`ℹ️ Notice: Set live FAST2SMS_API_KEY in backend/.env for live SMS delivery.`);
      console.log(`========================================================================\n`);

      return {
        success: true,
        provider: 'fast2sms (simulated)',
        simulated: true,
      };
    }

    try {
      // 1. Try Fast2SMS Quick SMS Route ('q')
      let response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: cleanNumber,
        }),
      });

      let data: any = await response.json();

      // If Quick SMS route is rejected, try OTP route ('otp')
      if (!response.ok || !data.return) {
        console.warn('Fast2SMS Quick SMS route responded with issue, attempting route: "otp"...', data);
        response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otpCode,
            numbers: cleanNumber,
          }),
        });
        data = await response.json();
      }

      if (!response.ok || !data.return) {
        console.error('Fast2SMS API Error:', data);
        throw new Error(data.message?.[0] || data.message || 'Failed to dispatch SMS via Fast2SMS');
      }

      console.log(`[Fast2SMS] Dispatched successfully to ${cleanNumber}. Request ID: ${data.request_id}`);
      return {
        success: true,
        provider: 'fast2sms',
        messageId: data.request_id,
      };
    } catch (err: any) {
      console.error('Fast2SMS dispatch exception:', err.message);
      console.log(`[FALLBACK SMS OTP for ${toPhone}]: ${otpCode}`);
      return {
        success: true,
        provider: 'fast2sms (fallback)',
        simulated: true,
      };
    }
  }
}

export const smsService = new SmsService();
