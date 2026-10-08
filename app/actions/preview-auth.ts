"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PREVIEW_COOKIE, PREVIEW_COOKIE_MAX_AGE, expectedPreviewToken } from "@/lib/previewAuth";

export async function previewLogin(formData: FormData) {
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/quizzes";
  const expectedPassword = process.env.QUIZ_PREVIEW_PASSWORD;
  const token = expectedPreviewToken();

  if (!expectedPassword || !token || password !== expectedPassword) {
    redirect(`/quizzes/preview-login?error=1&next=${encodeURIComponent(next)}`);
  }

  const jar = await cookies();
  jar.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PREVIEW_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect(next.startsWith("/") ? next : "/quizzes");
}

export async function previewLogout() {
  const jar = await cookies();
  jar.delete(PREVIEW_COOKIE);
  redirect("/quizzes/preview-login");
}
