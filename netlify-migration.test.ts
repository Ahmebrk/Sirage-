import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiApp } from "./app";
import { hashAdminPassword, verifyAdminPassword } from "./admin-auth";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  buildWhatsAppConfirmationUrl,
  normalizeAlgerianWhatsApp,
} from "../client/src/lib/whatsapp";
import {
  adminAccess,
  adminSessions,
  deliverySettings,
  orders,
  products,
} from "../drizzle/schema";

describe("Netlify migration safety", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    server = createServer(createApiApp());
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it("serves the preserved API health endpoint through the reusable app", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("keeps the read-only delivery catalog available without a write or reseed", async () => {
    const input = encodeURIComponent(JSON.stringify({ json: null }));
    const response = await fetch(
      `${baseUrl}/api/trpc/delivery.config?input=${input}`
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      result?: { data?: { json?: { wilayas?: string[] } } };
    };
    expect(body.result?.data?.json?.wilayas).toHaveLength(58);
  });

  it("rejects direct admin API access without OAuth or a client password session", async () => {
    const input = encodeURIComponent(JSON.stringify({ json: null }));
    const response = await fetch(
      `${baseUrl}/api/trpc/admin.stats?input=${input}`
    );
    expect(response.status).toBe(403);
  });

  it("covers the persisted store schema without touching production data", () => {
    expect(products).toBeDefined();
    expect(orders).toBeDefined();
    expect(deliverySettings).toBeDefined();
    expect(adminAccess).toBeDefined();
    expect(adminSessions).toBeDefined();
  });

  it("hashes and verifies client passwords without storing plaintext", async () => {
    const result = await hashAdminPassword("client-password-1234");
    expect(result.passwordHash).not.toContain("client-password-1234");
    expect(result.salt).toHaveLength(32);
    await expect(
      verifyAdminPassword(
        "client-password-1234",
        result.salt,
        result.passwordHash
      )
    ).resolves.toBe(true);
    await expect(
      verifyAdminPassword(
        "wrong-password-1234",
        result.salt,
        result.passwordHash
      )
    ).resolves.toBe(false);
  });

  it("requires secure cross-site HTTP-only admin session cookies", () => {
    const options = getSessionCookieOptions({} as never);
    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("none");
  });

  it("builds an Algerian WhatsApp order-confirmation URL", () => {
    expect(normalizeAlgerianWhatsApp("0550 11 22 33")).toBe("213550112233");
    const url = buildWhatsAppConfirmationUrl("0550112233", {
      orderNumber: "SRG-TEST01",
      customerName: "عميل الاختبار",
      wilaya: "الجزائر",
      total: 12500,
      items: [{ nameAr: "حذاء رياضي", quantity: 1 }],
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/213550112233\?text=/);
    expect(url).toContain(encodeURIComponent("SRG-TEST01"));
  });
});
