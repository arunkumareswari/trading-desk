"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function revalidateAllMistakeRoutes() {
  revalidatePath("/settings");
  revalidatePath("/journal");
  revalidatePath("/journal/new");
}

export async function addMistake(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Mistake name cannot be empty");
  }

  const existing = await db.mistake.findUnique({
    where: { name: trimmed },
  });

  if (existing) {
    throw new Error(`A mistake named "${trimmed}" already exists`);
  }

  const mistake = await db.mistake.create({
    data: { name: trimmed, isCustom: true },
  });

  revalidateAllMistakeRoutes();
  return mistake;
}

export async function updateMistake(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Mistake name cannot be empty");
  }

  const duplicate = await db.mistake.findUnique({
    where: { name: trimmed },
  });

  if (duplicate && duplicate.id !== id) {
    throw new Error(`A mistake named "${trimmed}" already exists`);
  }

  const updated = await db.mistake.update({
    where: { id },
    data: { name: trimmed },
  });

  revalidateAllMistakeRoutes();
  return updated;
}

export async function deleteMistake(id: string) {
  const mistake = await db.mistake.findUnique({ where: { id } });
  if (!mistake) return;

  await db.mistake.delete({ where: { id } });
  revalidateAllMistakeRoutes();
}
