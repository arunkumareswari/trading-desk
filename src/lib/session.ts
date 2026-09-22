import { cookies } from "next/headers";
import { ALL_ACCOUNTS_ID } from "@/lib/constants";

export const SELECTED_ACCOUNT_COOKIE = "tj_selected_account";

/** Read-only: safe to call from any Server Component during render. */
export async function getSelectedAccountId(): Promise<string> {
  const store = await cookies();
  return store.get(SELECTED_ACCOUNT_COOKIE)?.value ?? ALL_ACCOUNTS_ID;
}
