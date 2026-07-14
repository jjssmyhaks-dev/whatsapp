import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16; // 128 bits for GCM
  private readonly authTagLength = 16; // 128 bits
  private readonly saltLength = 32;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    // Ensure the key is 32 bytes (256 bits) for AES-256
    this.key = Buffer.from(encryptionKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM
   * @param plaintext The text to encrypt
   * @returns Encrypted string in format: salt:iv:authTag:ciphertext (hex encoded)
   */
  encrypt(plaintext: string): string {
    // Generate random salt and IV
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine all parts with colon separator
    const result = Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')]).toString('hex');
    
    return result;
  }

  /**
   * Decrypts ciphertext encrypted with this service
   * @param ciphertext The encrypted string
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, 'hex');
    
    // Extract components
    const salt = buffer.subarray(0, this.saltLength);
    const iv = buffer.subarray(this.saltLength, this.saltLength + this.ivLength);
    const authTag = buffer.subarray(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.authTagLength,
    );
    const encrypted = buffer.subarray(
      this.saltLength + this.ivLength + this.authTagLength,
    );

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypts data for a specific tenant using tenant-specific key derivation
   * @param plaintext The text to encrypt
   * @param tenantId Tenant identifier for key derivation
   * @returns Encrypted string
   */
  encryptForTenant(plaintext: string, tenantId: string): string {
    // Derive tenant-specific key
    const tenantKey = this.deriveTenantKey(tenantId);
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, tenantKey, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine all parts: version:salt:iv:authTag:ciphertext
    // Version 1 = tenant-specific encryption
    const version = Buffer.of(0x01);
    const result = Buffer.concat([
      version,
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]).toString('hex');
    
    return result;
  }

  /**
   * Decrypts tenant-specific encrypted data
   * @param ciphertext The encrypted string
   * @param tenantId Tenant identifier
   * @returns Decrypted plaintext
   */
  decryptForTenant(ciphertext: string, tenantId: string): string {
    const buffer = Buffer.from(ciphertext, 'hex');
    
    // Check version
    const version = buffer[0];
    let offset = 1;
    
    if (version === 0x01) {
      // Tenant-specific encryption
      const tenantKey = this.deriveTenantKey(tenantId);
      
      const salt = buffer.subarray(offset, offset + this.saltLength);
      offset += this.saltLength;
      
      const iv = buffer.subarray(offset, offset + this.ivLength);
      offset += this.ivLength;
      
      const authTag = buffer.subarray(offset, offset + this.authTagLength);
      offset += this.authTagLength;
      
      const encrypted = buffer.subarray(offset);

      const decipher = crypto.createDecipheriv(this.algorithm, tenantKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } else {
      // Legacy encryption (no tenant-specific key)
      return this.decrypt(ciphertext);
    }
  }

  /**
   * Derives a tenant-specific encryption key from the master key and tenant ID
   * @param tenantId Tenant identifier
   * @returns Derived key buffer
   */
  private deriveTenantKey(tenantId: string): Buffer {
    // Use HKDF to derive a tenant-specific key
    const hkdf = crypto.createHmac('sha256', this.key);
    hkdf.update(tenantId);
    const derivedKey = hkdf.digest();
    
    // Ensure we have 32 bytes
    return derivedKey.subarray(0, 32);
  }

  /**
   * Generates a secure random encryption key
   * @returns Hex-encoded 32-byte key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hashes a string using SHA-256
   * @param data String to hash
   * @returns Hex-encoded hash
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Creates a HMAC signature for data
   * @param data Data to sign
   * @param secret Secret key
   * @returns Hex-encoded HMAC
   */
  hmac(data: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verifies a HMAC signature
   * @param data Original data
   * @param signature Signature to verify
   * @param secret Secret key
   * @returns True if signature is valid
   */
  verifyHmac(data: string, signature: string, secret: string): boolean {
    const expected = this.hmac(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  }
}
