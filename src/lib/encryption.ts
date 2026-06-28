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
  
  // If it's a legacy plain number/decimal, it won't contain a colon separating IV and ciphertext.
  if (!encryptedText.includes(":")) {
    return encryptedText;
  }
  
  try {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt amount:", error);
    return "0";
  }
}
