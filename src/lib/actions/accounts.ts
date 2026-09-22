"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { accountFormSchema, type AccountFormValues } from "@/lib/schemas/account";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createAccount(raw: AccountFormValues) {
  const data = accountFormSchema.parse(raw);
  const account = await db.account.create({ data });
  revalidateAll();
  return account.id;
}

export async function updateAccount(id: string, raw: AccountFormValues) {
  const data = accountFormSchema.parse(raw);
  await db.account.update({ where: { id }, data });
  revalidateAll();
}

export async function deleteAccount(id: string) {
  await db.account.delete({ where: { id } });
  revalidateAll();
}
