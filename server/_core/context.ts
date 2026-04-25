import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getOrCreateAnonymousUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication failed — use anonymous fallback user for development
    user = null;
  }

  // If no authenticated user, provide an anonymous operator so all features work without login
  if (!user) {
    try {
      user = await getOrCreateAnonymousUser();
    } catch (e) {
      console.warn("[Context] Could not create anonymous user:", e);
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
