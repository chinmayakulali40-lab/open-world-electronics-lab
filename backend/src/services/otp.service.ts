import crypto from 'crypto';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

interface PasswordTokenRecord {
  email: string;
  expiresAt: number;
}

class OtpService {
  private otpStore = new Map<string, OtpRecord>();
  private passwordTokenStore = new Map<string, PasswordTokenRecord>();

  constructor() {
    // Periodic garbage collection every 5 minutes to prevent memory leaks
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Generates a secure 6-digit numeric OTP code.
   */
  public generateNumericOtp(length = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * Checks whether an OTP can be requested (rate limiting: 60s cooldown).
   */
  public checkRateLimit(identifier: string, cooldownSec = 60): { allowed: boolean; remainingSec: number } {
    const key = identifier.toLowerCase().trim();
    const existing = this.otpStore.get(key);

    if (!existing) {
      return { allowed: true, remainingSec: 0 };
    }

    const elapsedMs = Date.now() - existing.lastSentAt;
    const cooldownMs = cooldownSec * 1000;

    if (elapsedMs < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
      return { allowed: false, remainingSec };
    }

    return { allowed: true, remainingSec: 0 };
  }

  /**
   * Stores an OTP for a given identifier (phone or email) with a 5-minute TTL.
   */
  public storeOtp(identifier: string, code: string, ttlMs = 5 * 60 * 1000): void {
    const key = identifier.toLowerCase().trim();
    const record: OtpRecord = {
      code: code.trim(),
      expiresAt: Date.now() + ttlMs,
      attempts: 0,
      lastSentAt: Date.now(),
    };

    this.otpStore.set(key, record);

    // If identifier is a phone number, normalize formats for seamless matching
    const cleanDigits = key.replace(/\D/g, '');
    if (cleanDigits && cleanDigits !== key) {
      this.otpStore.set(cleanDigits, record);
      if (cleanDigits.length > 10) {
        this.otpStore.set(cleanDigits.slice(-10), record);
      }
    }
  }

  /**
   * Validates an OTP code with max attempt throttling.
   */
  public verifyOtp(identifier: string, enteredCode: string, maxAttempts = 3): { valid: boolean; error?: string } {
    const key = identifier.toLowerCase().trim();
    let record = this.otpStore.get(key);

    if (!record) {
      const cleanDigits = key.replace(/\D/g, '');
      record = this.otpStore.get(cleanDigits);
      if (!record && cleanDigits.length >= 10) {
        record = this.otpStore.get(cleanDigits.slice(-10));
      }
    }

    if (!record) {
      return {
        valid: false,
        error: 'No active verification code found. Please request a new code.',
      };
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(key);
      return {
        valid: false,
        error: 'Verification code has expired. Please request a new code.',
      };
    }

    if (record.attempts >= maxAttempts) {
      this.otpStore.delete(key);
      return {
        valid: false,
        error: 'Too many incorrect attempts. This code is now invalid. Please request a new code.',
      };
    }

    if (record.code !== enteredCode.trim()) {
      record.attempts += 1;
      const remainingAttempts = maxAttempts - record.attempts;
      return {
        valid: false,
        error: `Incorrect code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      };
    }

    // Success - consume and remove code
    this.otpStore.delete(key);
    const cleanDigits = key.replace(/\D/g, '');
    if (cleanDigits) {
      this.otpStore.delete(cleanDigits);
      if (cleanDigits.length > 10) {
        this.otpStore.delete(cleanDigits.slice(-10));
      }
    }
    return { valid: true };
  }

  /**
   * Invalidate OTP for an identifier manually.
   */
  public clearOtp(identifier: string): void {
    this.otpStore.delete(identifier.toLowerCase().trim());
  }

  /**
   * Creates a cryptographically secure token for password setup / reset with a 15-minute TTL.
   */
  public createPasswordSetupToken(email: string, ttlMs = 15 * 60 * 1000): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordTokenStore.set(token, {
      email: email.toLowerCase().trim(),
      expiresAt: Date.now() + ttlMs,
    });
    return token;
  }

  /**
   * Validates a password setup / reset token.
   */
  public verifyPasswordSetupToken(token: string): { valid: boolean; email?: string; error?: string } {
    const record = this.passwordTokenStore.get(token);

    if (!record) {
      return { valid: false, error: 'Invalid or expired password setup link.' };
    }

    if (Date.now() > record.expiresAt) {
      this.passwordTokenStore.delete(token);
      return { valid: false, error: 'This password setup link has expired. Please request a new one.' };
    }

    return { valid: true, email: record.email };
  }

  /**
   * Consumes and invalidates a password setup token.
   */
  public invalidatePasswordSetupToken(token: string): void {
    this.passwordTokenStore.delete(token);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.otpStore.entries()) {
      if (now > record.expiresAt) {
        this.otpStore.delete(key);
      }
    }
    for (const [token, record] of this.passwordTokenStore.entries()) {
      if (now > record.expiresAt) {
        this.passwordTokenStore.delete(token);
      }
    }
  }
}

export const otpService = new OtpService();
