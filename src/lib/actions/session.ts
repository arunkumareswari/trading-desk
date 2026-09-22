"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SELECTED_ACCOUNT_COOKIE } from "@/lib/session";

/** Sets the globally active account/workspace. Every page reads this cookie
 * server-side, so the selection persists across navigation without any
 * client state to keep in sync. */
export async function setSelectedAccount(accountId: string) {
  const store = await cookies();
  store.set(SELECTED_ACCOUNT_COOKIE, accountId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
