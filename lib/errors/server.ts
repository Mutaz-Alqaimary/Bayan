import "server-only";

import { getTranslations } from "next-intl/server";

import { buildErrorMessages, type ErrorMessages } from "@/lib/errors/types";

/** Safe, localized error copy for Server Components, Server Actions, and Route Handlers. */
export async function getErrorMessages(): Promise<ErrorMessages> {
  const t = await getTranslations("errors");
  return buildErrorMessages(t);
}
