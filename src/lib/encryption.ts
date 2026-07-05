import crypto from "crypto";

const getEncryptionKey = (): Buffer => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return crypto.scryptSync("fallback_secret_encryption_compilation_only", "salt-finance", 32);
  }
  return crypto.scryptSync(secret, "salt-finance", 32);
};

/**
 * Encrypts a numeric amount string or number.
 * Returns the encrypted string in the format "ivHex:encryptedHex".
 */
export function encryptAmount(amount: string | number): string {
  const value = String(amount);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an encrypted amount string.
 * If the string is not encrypted (e.g., legacy database record or empty), returns it as-is.
 */
export function decryptAmount(encryptedText: string | null | undefined): string {
  if (!encryptedText) return "0";
  
  // An encrypted text must be in the format "ivHex:encryptedHex"
  // ivHex is 16 bytes = 32 hex characters
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    return encryptedText;
  }
  
  const [ivHex, encryptedHex] = parts;
  const hexRegex = /^[0-9a-fA-F]+$/;
  
  if (ivHex.length !== 32 || !hexRegex.test(ivHex) || !hexRegex.test(encryptedHex)) {
    return encryptedText;
  }
  
  try {
    const iv = Buffer.from(ivHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.warn("Failed to decrypt amount: Key mismatch or bad ciphertext format.");
    return "0";
  }
}
