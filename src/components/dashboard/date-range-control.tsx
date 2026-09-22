"use client";

import { useState, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import type { DateRangePreset } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "ALL", label: "ALL" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "YTD", label: "YTD" },
  { value: "1Y", label: "1Y" },
  { value: "CUSTOM", label: "Custom..." },
];

export function DateRangeControl({
  current,
  from,
  to,
}: {
  current: DateRangePreset;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const [customOpen, setCustomOpen] = useState(false);
  const isCustomSelectingRef = useRef(false);

  function setRange(preset: DateRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    if (preset === "ALL") {
      params.delete("range");
    } else {
      params.set("range", preset);
    }
    params.delete("from");
    params.delete("to");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function openCustom() {
    isCustomSelectingRef.current = true;
    setCustomOpen(true);
    setTimeout(() => {
      isCustomSelectingRef.current = false;
    }, 400);
  }

  function handleSelectChange(val: string) {
    if (val === "CUSTOM") {
      openCustom();
    } else {
      setCustomOpen(false);
      setRange(val as DateRangePreset);
    }
  }

  function applyCustom() {
    if (!customFrom && !customTo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "CUSTOM");
    if (customFrom) params.set("from", customFrom);
    if (customTo) params.set("to", customTo);
    router.push(`${pathname}?${params.toString()}`);
    setCustomOpen(false);
  }

  return (
    <Popover
      open={customOpen}
      onOpenChange={(open) => {
        if (!open && isCustomSelectingRef.current) {
          return;
        }
        setCustomOpen(open);
      }}
    >
      <PopoverAnchor asChild>
        <div className="flex items-center gap-2">
          <Select
            value={customOpen ? "CUSTOM" : current}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="h-8 w-28 bg-secondary/40 border-border text-xs font-medium hover:bg-secondary/60">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent
              align="end"
              onCloseAutoFocus={(e) => {
                if (isCustomSelectingRef.current) {
                  e.preventDefault();
                }
              }}
            >
              {PRESET_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                  onPointerUp={() => {
                    if (opt.value === "CUSTOM") {
                      openCustom();
                    }
                  }}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {current === "CUSTOM" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomOpen((prev) => !prev)}
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              title="Edit Custom Date Range"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>
                {from && to ? `${from} – ${to}` : from ? `From ${from}` : to ? `Until ${to}` : "Set Dates"}
              </span>
            </Button>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 p-3 space-y-3 bg-popover border border-border shadow-xl rounded-xl z-50"
        onPointerDownOutside={(e) => {
          if (isCustomSelectingRef.current) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isCustomSelectingRef.current) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-semibold text-foreground">Custom Date Range</span>
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">From</Label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 text-xs px-2"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">To</Label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 text-xs px-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 pt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setCustomOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={applyCustom}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
