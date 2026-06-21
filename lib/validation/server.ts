import "server-only";

import { getTranslations } from "next-intl/server";

import { buildValidationMessages, type ValidationMessages } from "@/lib/validation/types";

/** Localized Zod validation copy for Server Components, Server Actions, and Route Handlers. */
export async function getValidationMessages(): Promise<ValidationMessages> {
  const t = await getTranslations("validation");
  return buildValidationMessages(t);
}
