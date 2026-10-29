import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { isPasswordAdminRequest } from "../admin-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminAuth: "oauth" | "password" | null;
  isAdmin: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const passwordAdmin = await isPasswordAdminRequest(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminAuth:
      user?.role === "admin" ? "oauth" : passwordAdmin ? "password" : null,
    isAdmin: user?.role === "admin" || passwordAdmin,
  };
}
