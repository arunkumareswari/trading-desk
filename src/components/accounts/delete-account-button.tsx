"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/actions/accounts";

export function DeleteAccountButton({
  accountId,
  accountName,
  children,
  className,
  variant = "ghost",
}: {
  accountId: string;
  accountName: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "ghost" | "destructive" | "outline";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Delete "${accountName}" and all of its trades? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteAccount(accountId);
      toast.success("Account deleted");
      router.refresh();
    });
  }

  return (
    <Button
      variant={variant}
      size={children ? "sm" : "icon-sm"}
      onClick={onDelete}
      disabled={isPending}
      className={className ?? "text-muted-foreground hover:text-destructive"}
    >
      <Trash2 className="h-4 w-4" />
      {children}
    </Button>
  );
}
