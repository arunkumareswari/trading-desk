"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "@/components/accounts/account-form";
import { setSelectedAccount } from "@/lib/actions/session";
import type { Account } from "@/generated/prisma/client";

export function AccountSelector({
  accounts,
  selectedId,
}: {
  accounts: Account[];
  selectedId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  const current = accounts.find((a) => a.id === selectedId) ?? accounts[0];
  const label = current ? current.name : "Select Workspace";

  function select(id: string) {
    startTransition(async () => {
      await setSelectedAccount(id);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-3 gap-2 border-border bg-secondary/40 hover:bg-secondary/70 font-medium text-xs sm:text-sm"
            disabled={isPending}
          >
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="max-w-[150px] truncate">{label}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Workspace</DropdownMenuLabel>
          {accounts.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => select(a.id)} className="justify-between">
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{a.name}</span>
                {a.isDemo && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                    Demo
                  </Badge>
                )}
              </span>
              {current?.id === a.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
          {accounts.length === 0 && (
            <div className="px-2 py-2 text-xs text-muted-foreground">No accounts yet — add one below.</div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2 text-primary">
            <Plus className="h-4 w-4" /> Add Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Account / Workspace</DialogTitle>
          </DialogHeader>
          <AccountForm
            onSuccess={(id) => {
              setCreateOpen(false);
              select(id);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
