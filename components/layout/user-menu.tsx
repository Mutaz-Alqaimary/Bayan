"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/features/auth/actions";
import type { SessionUser } from "@/features/auth/types";
import { avatarPublicUrl } from "@/lib/avatar";

/** Two-letter initials from a name (first letters of the first two words). */
function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Account menu in the top bar: identity summary and sign out. Settings lives in
 * the sidebar navigation (a working `/settings` link), so it is intentionally not
 * duplicated here. Sign out runs the server action inside a transition; the action
 * clears the session and redirects to login.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const t = useTranslations("nav");
  const [isPending, startTransition] = useTransition();

  const display = user.profile.full_name?.trim() || user.email || "";
  const avatarUrl = user.profile.avatar_url
    ? avatarPublicUrl(user.profile.avatar_url, user.profile.updated_at)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-1.5 sm:px-2"
          aria-label={t("account")}
        >
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime public URL from a stored path
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials(display)
            )}
          </span>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {display}
          </span>
          <ChevronsUpDown
            className="hidden size-4 text-muted-foreground sm:inline"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{display}</span>
          {user.email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              void signOutAction();
            });
          }}
        >
          <LogOut aria-hidden="true" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
