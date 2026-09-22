"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addMistake, deleteMistake } from "@/lib/actions/mistakes";
import type { Mistake } from "@/generated/prisma/client";

export function MistakeManager({ mistakes }: { mistakes: Mistake[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      await addMistake(name);
      setName("");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteMistake(id);
      toast.success("Mistake removed");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a custom mistake"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <Button onClick={add} disabled={isPending} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {mistakes.map((m) => (
          <Badge key={m.id} variant="secondary" className="gap-1 pr-1 font-normal">
            {m.name}
            {m.isCustom && (
              <button onClick={() => remove(m.id)} className="rounded-sm hover:bg-background/50">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
