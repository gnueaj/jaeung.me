import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_LENGTH = 64;

export class CommentsNotConfiguredError extends Error {
  constructor() {
    super("Playground comments are not configured.");
    this.name = "CommentsNotConfiguredError";
  }
}

export function getCommentsDatabase() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) throw new CommentsNotConfiguredError();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function hashCommentPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, HASH_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyCommentPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHex] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== HASH_LENGTH) return false;

  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return timingSafeEqual(actual, expected);
}

export function verifyGuestbookAdminPassword(password: string) {
  const adminPassword = process.env.GUESTBOOK_ADMIN_PASSWORD;
  if (!adminPassword) return false;

  // Compare fixed-length digests so the secret's length is not exposed by comparison timing.
  const actual = createHash("sha256").update(password).digest();
  const expected = createHash("sha256").update(adminPassword).digest();
  return timingSafeEqual(actual, expected);
}
