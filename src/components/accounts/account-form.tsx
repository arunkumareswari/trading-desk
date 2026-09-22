"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { accountFormSchema, type AccountFormValues } from "@/lib/schemas/account";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { ALL_CURRENCIES, POPULAR_CURRENCIES, findCurrency } from "@/lib/currencies";
import type { Account } from "@/generated/prisma/client";

export function AccountForm({
  account,
  onSuccess,
}: {
  account?: Account;
  onSuccess: (accountId: string) => void;
}) {
  const [openCurrency, setOpenCurrency] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: account
      ? {
          name: account.name,
          startingBalance: account.startingBalance,
          currency: account.currency,
          isDemo: account.isDemo,
        }
      : { name: "", startingBalance: 10000, currency: "USD", isDemo: false },
  });

  async function onSubmit(data: AccountFormValues) {
    try {
      if (account) {
        await updateAccount(account.id, data);
        toast.success("Account updated");
        onSuccess(account.id);
      } else {
        const id = await createAccount(data);
        toast.success("Account created");
        form.reset();
        onSuccess(id);
      }
    } catch {
      toast.error("Could not save account");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Account name" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting Balance</FormLabel>
              <FormControl>
                <Input type="number" step="any" {...field} value={field.value as number} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => {
            const selected = findCurrency(field.value);
            return (
              <FormItem className="flex flex-col">
                <FormLabel>Currency</FormLabel>
                <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCurrency}
                        className="h-9 w-full justify-between rounded-md border-input bg-input/20 px-3 font-normal text-left shadow-none hover:bg-input/40"
                      >
                        {selected ? (
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none">{selected.flag}</span>
                            <span className="font-semibold text-foreground">{selected.code}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              — {selected.name} ({selected.symbol})
                            </span>
                          </span>
                        ) : field.value ? (
                          <span className="font-semibold text-foreground">{field.value}</span>
                        ) : (
                          <span className="text-muted-foreground">Select currency...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[320px] sm:w-[350px] p-0 shadow-xl border-border bg-popover z-[100]"
                    align="start"
                  >
                    <Command className="bg-popover">
                      <CommandInput placeholder="Search country or currency..." autoFocus />
                      <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty>No country or currency found.</CommandEmpty>
                        <CommandGroup heading="Popular Currencies">
                          {POPULAR_CURRENCIES.map((curr) => (
                            <CommandItem
                              key={`pop-${curr.code}`}
                              value={`${curr.code} ${curr.name} ${curr.country} ${curr.symbol}`}
                              onSelect={() => {
                                field.onChange(curr.code);
                                setOpenCurrency(false);
                              }}
                              className="flex items-center justify-between cursor-pointer py-2 px-2.5 hover:bg-accent rounded-md"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="text-base leading-none">{curr.flag}</span>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-foreground">
                                      {curr.code}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      ({curr.symbol})
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {curr.country} · {curr.name}
                                  </span>
                                </div>
                              </div>
                              {field.value === curr.code && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="All Countries / Currencies">
                          {ALL_CURRENCIES.map((curr) => (
                            <CommandItem
                              key={curr.code}
                              value={`${curr.code} ${curr.name} ${curr.country} ${curr.symbol}`}
                              onSelect={() => {
                                field.onChange(curr.code);
                                setOpenCurrency(false);
                              }}
                              className="flex items-center justify-between cursor-pointer py-2 px-2.5 hover:bg-accent rounded-md"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="text-base leading-none">{curr.flag}</span>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-foreground">
                                      {curr.code}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      ({curr.symbol})
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {curr.country} · {curr.name}
                                  </span>
                                </div>
                              </div>
                              {field.value === curr.code && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="isDemo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Demo account</FormLabel>
                <p className="text-xs text-muted-foreground">Flag this as sample/demo data.</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {account ? "Save Changes" : "Create Account"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
