"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PREDEFINED_MISTAKES } from "@/lib/constants";

import { addMistake } from "@/lib/actions/mistakes";

export function MistakePicker({
  value,
  onChange,
  availableMistakes,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  availableMistakes?: string[];
}) {
  const [custom, setCustom] = useState("");
  const [extraMistakes, setExtraMistakes] = useState<string[]>([]);

  const options = Array.from(
    new Set([
      ...(availableMistakes !== undefined ? availableMistakes : PREDEFINED_MISTAKES),
      ...extraMistakes,
      ...value,
    ])
  ).sort((a, b) => a.localeCompare(b));

  async function add(name: string, persist = false) {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!extraMistakes.includes(trimmed)) {
      setExtraMistakes((prev) => [...prev, trimmed]);
    }

    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }

    if (persist) {
      try {
        await addMistake(trimmed);
      } catch (err) {
        console.error("Failed to persist mistake:", err);
      }
    }
  }

  function remove(name: string) {
    onChange(value.filter((m) => m !== name));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((m) => (
          <Badge key={m} variant="secondary" className="gap-1 pr-1 font-normal text-xs">
            {m}
            <button type="button" onClick={() => remove(m)} className="rounded-sm hover:bg-background/50 p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {value.length === 0 && <span className="text-xs text-muted-foreground">No mistakes tagged.</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select onValueChange={add}>
          <SelectTrigger className="w-full sm:w-64 md:w-72">
            <SelectValue placeholder="Select a mistake" />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4} align="start">
            {options.map((m) => (
              <SelectItem key={m} value={m} disabled={value.includes(m)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Add mistake"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(custom, true);
                setCustom("");
              }
            }}
            className="w-36 sm:w-44"
          />
          {custom.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                add(custom, true);
                setCustom("");
              }}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-secondary px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
