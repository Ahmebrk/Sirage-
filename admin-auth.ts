import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import { and, eq, gt } from "drizzle-orm";
import { adminAccess, adminSessions } from "../drizzle/schema";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";

const scrypt = promisify(scryptCallback);
export const ADMIN_SESSION_COOKIE = "sirage_admin_session";
const ACCESS_ID = 1;
const SESSION_DAYS = 30;
const SETUP_HOURS = 24;

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function derivePassword(password: string, salt: string) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return derived.toString("hex");
}

function equalHex(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hashAdminPassword(
  password: string,
  salt = randomBytes(16).toString("hex")
) {
  return { salt, passwordHash: await derivePassword(password, salt) };
}

export async function verifyAdminPassword(
  password: string,
  salt: string,
  passwordHash: string
) {
  return equalHex(await derivePassword(password, salt), passwordHash);
}

function cookieOptions(req: Request) {
  return {
    ...getSessionCookieOptions(req),
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

function readSessionCookie(req: Request) {
  return parseCookieHeader(req.headers.cookie ?? "")[ADMIN_SESSION_COOKIE];
}

export async function isPasswordAdminRequest(req: Request) {
  const token = readSessionCookie(req);
  if (!token) return false;
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: adminSessions.id })
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.tokenHash, digest(token)),
        gt(adminSessions.expiresAt, new Date())
      )
    )
    .limit(1);
  return Boolean(rows[0]);
}

export async function isPasswordConfigured() {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ passwordHash: adminAccess.passwordHash })
    .from(adminAccess)
    .where(eq(adminAccess.id, ACCESS_ID))
    .limit(1);
  return Boolean(rows[0]?.passwordHash);
}

export async function issueClientSetupToken() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SETUP_HOURS * 60 * 60 * 1000);
  await db
    .insert(adminAccess)
    .values({
      id: ACCESS_ID,
      setupTokenHash: digest(token),
      setupExpiresAt: expiresAt,
    })
    .onDuplicateKeyUpdate({
      set: { setupTokenHash: digest(token), setupExpiresAt: expiresAt },
    });
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function completeClientSetup(token: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select()
    .from(adminAccess)
    .where(
      and(
        eq(adminAccess.id, ACCESS_ID),
        eq(adminAccess.setupTokenHash, digest(token)),
        gt(adminAccess.setupExpiresAt, new Date())
      )
    )
    .limit(1);
  if (!rows[0]) return false;
  const { salt, passwordHash } = await hashAdminPassword(password);
  await db
    .update(adminAccess)
    .set({
      passwordHash,
      passwordSalt: salt,
      setupTokenHash: null,
      setupExpiresAt: null,
    })
    .where(eq(adminAccess.id, ACCESS_ID));
  await db.delete(adminSessions);
  return true;
}

export async function loginWithPassword(
  req: Request,
  res: Response,
  password: string
) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(adminAccess)
    .where(eq(adminAccess.id, ACCESS_ID))
    .limit(1);
  const record = rows[0];
  if (!record?.passwordHash || !record.passwordSalt) return false;
  if (
    !(await verifyAdminPassword(
      password,
      record.passwordSalt,
      record.passwordHash
    ))
  )
    return false;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db
    .insert(adminSessions)
    .values({ tokenHash: digest(token), expiresAt });
  res.cookie(ADMIN_SESSION_COOKIE, token, cookieOptions(req));
  return true;
}

export async function logoutPassword(req: Request, res: Response) {
  const token = readSessionCookie(req);
  const db = await getDb();
  if (db && token)
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.tokenHash, digest(token)));
  res.clearCookie(ADMIN_SESSION_COOKIE, getSessionCookieOptions(req));
}
