"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { closeDate, type MetricsTrade } from "@/lib/metrics";
import { formatCurrency, formatPercent, formatR, formatSignedCurrency, pnlClass } from "@/lib/format";
import { SideBadge, ResultBadge } from "@/components/journal/badges";
import { deleteTrade } from "@/lib/actions/trades";
import { toast } from "sonner";
import type { Account } from "@/generated/prisma/client";

const ALL = "__all__";

export function JournalTable({ trades, accounts }: { trades: MetricsTrade[]; accounts: Account[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [symbolFilter, setSymbolFilter] = useState(ALL);
  const [setupFilter, setSetupFilter] = useState(ALL);
  const [resultFilter, setResultFilter] = useState(ALL);
  const [sideFilter, setSideFilter] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const accountName = useMemo(() => {
    const map = new Map(accounts.map((a) => [a.id, a.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [accounts]);

  const symbols = useMemo(() => [...new Set(trades.map((t) => t.symbol))].sort(), [trades]);
  const setups = useMemo(
    () => [...new Set(trades.map((t) => t.setup).filter((s): s is string => !!s))].sort(),
    [trades],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trades.filter((t) => {
      if (symbolFilter !== ALL && t.symbol !== symbolFilter) return false;
      if (setupFilter !== ALL && t.setup !== setupFilter) return false;
      if (resultFilter !== ALL && t.result !== resultFilter) return false;
      if (sideFilter !== ALL && t.side !== sideFilter) return false;
      if (dateFrom && closeDate(t) < new Date(dateFrom)) return false;
      if (dateTo && closeDate(t) > new Date(`${dateTo}T23:59:59`)) return false;
      if (q) {
        const haystack = `${t.symbol} ${t.setup ?? ""} ${t.notes ?? ""} ${t.mistakes.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [trades, search, symbolFilter, setupFilter, resultFilter, sideFilter, dateFrom, dateTo]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm("Delete this trade? This recalculates all downstream metrics.")) return;
      startTransition(async () => {
        await deleteTrade(id);
        toast.success("Trade deleted");
        router.refresh();
      });
    },
    [router, startTransition],
  );

  const columns = useMemo<ColumnDef<MetricsTrade>[]>(
    () => [
      { id: "date", accessorFn: (t) => t.date, header: "Date", size: 96, cell: ({ row }) => format(row.original.date, "MMM d, yyyy") },
      { id: "day", accessorFn: (t) => t.date, header: "Day", size: 56, enableSorting: false, cell: ({ row }) => format(row.original.date, "EEE") },
      { id: "account", accessorFn: (t) => accountName(t.accountId), header: "Account", size: 110, enableSorting: false },
      { id: "symbol", accessorKey: "symbol", header: "Symbol", size: 90 },
      { id: "side", accessorKey: "side", header: "L/S", size: 76, cell: ({ row }) => <SideBadge side={row.original.side as "LONG" | "SHORT"} /> },
      { id: "setup", accessorFn: (t) => t.setup ?? "—", header: "Setup", size: 130, enableSorting: false },
      { id: "entryPrice", accessorKey: "entryPrice", header: "Entry", size: 90, cell: ({ getValue }) => (getValue() as number).toLocaleString("en-US") },
      { id: "stopLoss", accessorFn: (t) => t.stopLoss, header: "SL", size: 90, cell: ({ getValue }) => (getValue() ? (getValue() as number).toLocaleString("en-US") : "—") },
      { id: "takeProfit", accessorFn: (t) => t.takeProfit, header: "TP", size: 90, cell: ({ getValue }) => (getValue() ? (getValue() as number).toLocaleString("en-US") : "—") },
      { id: "quantity", accessorKey: "quantity", header: "Qty", size: 80, cell: ({ getValue }) => (getValue() as number).toLocaleString("en-US") },
      { id: "exitPrice", accessorFn: (t) => t.exitPrice, header: "Exit", size: 90, cell: ({ getValue }) => (getValue() ? (getValue() as number).toLocaleString("en-US") : "—") },
      { id: "closingDate", accessorFn: (t) => t.closingDate, header: "Closed", size: 96, cell: ({ row }) => (row.original.closingDate ? format(row.original.closingDate, "MMM d, yyyy") : "—") },
      { id: "pnl", accessorKey: "pnl", header: "P&L", size: 96, cell: ({ getValue }) => <span className={pnlClass(getValue() as number)}>{formatSignedCurrency(getValue() as number)}</span> },
      { id: "brokerageCharges", accessorKey: "brokerageCharges", header: "Fees", size: 80, cell: ({ getValue }) => formatCurrency(getValue() as number) },
      { id: "netPnl", accessorKey: "netPnl", header: "Net P&L", size: 100, cell: ({ getValue }) => <span className={`font-medium ${pnlClass(getValue() as number)}`}>{formatSignedCurrency(getValue() as number)}</span> },
      { id: "result", accessorKey: "result", header: "W/L", size: 84, cell: ({ getValue }) => <ResultBadge result={getValue() as "WIN" | "LOSS" | "BREAKEVEN" | null} /> },
      { id: "plannedRR", accessorFn: (t) => t.plannedRR, header: "R:R", size: 70, cell: ({ getValue }) => (getValue() ? `${(getValue() as number).toFixed(2)}R` : "—") },
      { id: "riskAmount", accessorFn: (t) => t.riskAmount, header: "Risk $", size: 84, cell: ({ getValue }) => (getValue() ? formatCurrency(getValue() as number) : "—") },
      { id: "riskPercent", accessorFn: (t) => t.riskPercent, header: "Risk %", size: 76, cell: ({ getValue }) => (getValue() ? formatPercent(getValue() as number) : "—") },
      { id: "rMultiple", accessorFn: (t) => t.rMultiple, header: "R-Mult", size: 80, cell: ({ getValue }) => formatR(getValue() as number | null) },
      { id: "mistakes", accessorFn: (t) => t.mistakes.join(", ") || "—", header: "Mistake", size: 140, enableSorting: false },
      { id: "emotionDuring", accessorFn: (t) => t.emotionDuring ?? "—", header: "Emotion", size: 100, enableSorting: false },
      { id: "confidenceLevel", accessorFn: (t) => t.confidenceLevel, header: "Conf.", size: 64, cell: ({ getValue }) => getValue() ?? "—" },
      { id: "disciplineScore", accessorFn: (t) => t.disciplineScore, header: "Disc.", size: 64, cell: ({ getValue }) => getValue() ?? "—" },
      { id: "notes", accessorFn: (t) => t.notes ?? "", header: "Notes", size: 180, enableSorting: false, cell: ({ getValue }) => <span className="truncate block max-w-44 text-muted-foreground">{(getValue() as string) || "—"}</span> },
      {
        id: "actions",
        header: "",
        size: 44,
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/journal/${row.original.id}`}>View</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/journal/${row.original.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.original.id);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [accountName, handleDelete],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search symbol, setup, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 pl-8"
          />
        </div>
        <FilterSelect label="Symbol" value={symbolFilter} onChange={setSymbolFilter} options={symbols.map((s) => ({ value: s, label: s }))} />
        <FilterSelect label="Setup" value={setupFilter} onChange={setSetupFilter} options={setups.map((s) => ({ value: s, label: s }))} />
        <FilterSelect label="Result" value={resultFilter} onChange={setResultFilter} options={[{ value: "WIN", label: "Win" }, { value: "LOSS", label: "Loss" }, { value: "BREAKEVEN", label: "Breakeven" }]} />
        <FilterSelect label="Side" value={sideFilter} onChange={setSideFilter} options={[{ value: "LONG", label: "Long" }, { value: "SHORT", label: "Short" }]} />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} trades</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((c) => c.id !== "actions")
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {String(column.columnDef.header)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse font-sans text-xs sm:text-sm" style={{ width: table.getTotalSize() }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-secondary/40">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="relative select-none whitespace-nowrap px-3 py-2 text-left font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 disabled:cursor-default"
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ?? ""}
                      </button>
                    )}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/40"
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/journal/${row.original.id}`)}
                className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ width: cell.column.getSize() }} className="whitespace-nowrap px-3 py-2.5 font-sans tabular-nums text-foreground/90">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No trades match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" sideOffset={4} align="start">
        <SelectItem value={ALL}>All {label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
