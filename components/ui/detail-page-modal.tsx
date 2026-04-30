"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Modal } from "@/components/ui/modal";

type DetailPageModalProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  closeHref: string;
  size?: "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  children: ReactNode;
};

/**
 * Wrapper factorise pour afficher une page détail en popup.
 * Fermeture (overlay, Echap, croix) => retour vers closeHref.
 */
export function DetailPageModal({
  title,
  subtitle,
  icon,
  closeHref,
  size = "3xl",
  children,
}: DetailPageModalProps) {
  const router = useRouter();

  return (
    <Modal
      open
      onClose={() => router.push(closeHref)}
      title={title}
      subtitle={subtitle}
      icon={icon}
      size={size}
      cardClassName="max-h-[92vh]"
      bodyClassName="space-y-4"
    >
      {children}
    </Modal>
  );
}
