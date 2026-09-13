"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";

const MAX_LENGTH = 2000;

export async function postForumMessage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Le message ne peut pas etre vide." };
  if (content.length > MAX_LENGTH) {
    return { error: `Le message est trop long (max ${MAX_LENGTH} caracteres).` };
  }

  await prisma.forumMessage.create({ data: { userId: user.id, content } });

  revalidatePath("/forum");
  return { success: "Message publie." };
}
