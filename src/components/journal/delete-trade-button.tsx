"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTrade } from "@/lib/actions/trades";

export function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("Delete this trade? This recalculates all downstream metrics.")) return;
    startTransition(async () => {
      await deleteTrade(tradeId);
      toast.success("Trade deleted");
      router.push("/journal");
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" className="gap-1.5" onClick={onDelete} disabled={isPending}>
      <Trash2 className="h-3.5 w-3.5" /> Delete
    </Button>
  );
}
