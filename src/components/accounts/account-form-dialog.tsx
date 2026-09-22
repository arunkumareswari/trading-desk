"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountForm } from "@/components/accounts/account-form";
import type { Account } from "@/generated/prisma/client";

export function AccountFormDialog({
  account,
  trigger,
}: {
  account?: Account;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : account ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "New Account / Workspace"}</DialogTitle>
        </DialogHeader>
        <AccountForm
          account={account}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
