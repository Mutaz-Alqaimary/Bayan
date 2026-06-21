"use client";

import { useDirection } from "@radix-ui/react-direction";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

/**
 * Renders the active toasts. Mounted once at the app root (AppProviders).
 * Swipe-to-dismiss follows the inline-end edge, so it flips in RTL.
 */
export function Toaster() {
  const { toasts } = useToast();
  const direction = useDirection();
  const swipeDirection = direction === "rtl" ? "left" : "right";

  return (
    <ToastProvider swipeDirection={swipeDirection}>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast
          key={id}
          variant={variant}
          // Errors interrupt (assertive); routine toasts are announced politely.
          type={variant === "destructive" ? "foreground" : "background"}
          {...props}
        >
          <div className="grid gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
