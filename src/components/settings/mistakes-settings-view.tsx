"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { addMistake, updateMistake, deleteMistake } from "@/lib/actions/mistakes";
import type { Mistake } from "@/generated/prisma/client";

interface MistakeWithCount extends Mistake {
  _count?: {
    trades: number;
  };
}

export function MistakesSettingsView({
  mistakes,
}: {
  mistakes: MistakeWithCount[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Add Dialog State
  const [addOpen, setAddOpen] = useState(false);
  const [newMistakeName, setNewMistakeName] = useState("");

  // Edit Dialog State
  const [editItem, setEditItem] = useState<MistakeWithCount | null>(null);
  const [editName, setEditName] = useState("");

  // Delete Dialog State
  const [deleteItem, setDeleteItem] = useState<MistakeWithCount | null>(null);

  const filteredMistakes = mistakes.filter((m) =>
    m.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  function handleCreate() {
    const trimmed = newMistakeName.trim();
    if (!trimmed) {
      toast.error("Please enter a mistake name");
      return;
    }

    startTransition(async () => {
      try {
        await addMistake(trimmed);
        toast.success(`Mistake "${trimmed}" added successfully`);
        setNewMistakeName("");
        setAddOpen(false);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to add mistake";
        toast.error(msg);
      }
    });
  }

  function handleUpdate() {
    if (!editItem) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Please enter a mistake name");
      return;
    }

    startTransition(async () => {
      try {
        await updateMistake(editItem.id, trimmed);
        toast.success(`Mistake updated to "${trimmed}"`);
        setEditItem(null);
        setEditName("");
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update mistake";
        toast.error(msg);
      }
    });
  }

  function handleDelete() {
    if (!deleteItem) return;

    startTransition(async () => {
      try {
        await deleteMistake(deleteItem.id);
        toast.success(`Mistake "${deleteItem.name}" deleted`);
        setDeleteItem(null);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete mistake";
        toast.error(msg);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Mistakes Taxonomy</CardTitle>
              <Badge variant="secondary" className="text-xs font-normal">
                {mistakes.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              All trading mistakes available across your journal dropdowns and analytics.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setNewMistakeName("");
              setAddOpen(true);
            }}
            className="gap-1.5 h-9 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Mistake
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search mistakes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          {/* List of Mistakes */}
          <div className="divide-y divide-border/60 rounded-lg border border-border bg-card/40">
            {filteredMistakes.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {m.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {m._count?.trades ?? 0} trade{(m._count?.trades ?? 0) === 1 ? "" : "s"} logged
                      </span>
                      {m.isCustom && (
                        <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Edit mistake"
                    onClick={() => {
                      setEditItem(m);
                      setEditName(m.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete mistake"
                    onClick={() => setDeleteItem(m)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}

            {filteredMistakes.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {search.trim() ? "No mistakes match your search." : "No mistakes tracked yet. Click '+ Add Mistake' above."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Mistake Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">New Mistake</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new mistake to tag on trades and track in performance analytics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Mistake Name</Label>
              <Input
                placeholder="e.g., FOMO, Early Exit, Overleveraged"
                value={newMistakeName}
                onChange={(e) => setNewMistakeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="mt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={isPending || !newMistakeName.trim()}
            >
              {isPending ? "Adding..." : "Add Mistake"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mistake Dialog */}
      <Dialog open={Boolean(editItem)} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Mistake</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Renaming will update this mistake across all trades tagged with it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Mistake Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUpdate())}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="mt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUpdate}
              disabled={isPending || !editName.trim()}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <DialogContent className="sm:max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive">
              Delete Mistake
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteItem?.name}"</span>?
              {(deleteItem?._count?.trades ?? 0) > 0 && (
                <span className="block mt-1 text-amber-500 font-medium">
                  Note: This mistake is currently linked to {deleteItem?._count?.trades} trade(s).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Mistake"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
