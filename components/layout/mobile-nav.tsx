"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { UserRole } from "@/features/auth/types";

/**
 * Mobile navigation: a menu button (visible below `lg`) opening the nav in a
 * start-side drawer. Selecting an item closes the drawer so the user lands on
 * the new page cleanly.
 */
export function MobileNav({ role }: { role: UserRole }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("openMenu")}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </DrawerTrigger>
      <DrawerContent
        side="start"
        className="w-72 gap-0 bg-sidebar p-0"
        aria-describedby={undefined}
      >
        <DrawerTitle className="sr-only">{t("primary")}</DrawerTitle>
        <div className="flex h-16 shrink-0 items-center px-6">
          <BrandMark />
        </div>
        <nav
          aria-label={t("primary")}
          className="flex-1 overflow-y-auto px-4 pb-6"
        >
          <DashboardNav role={role} onNavigate={() => setOpen(false)} />
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
