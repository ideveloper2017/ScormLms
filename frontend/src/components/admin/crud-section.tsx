import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Plus, Trash2, Pencil, MoreHorizontal, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export interface CrudColumn<T> {
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
}

export interface CrudSectionProps<T, FormT> {
  title: string;
  description?: string;
  items: T[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
  columns: CrudColumn<T>[];
  search: (item: T) => string;
  getId: (item: T) => number;
  getName: (item: T) => string;
  blankForm: () => FormT;
  toForm: (item: T) => FormT;
  validate?: (form: FormT) => string | null;
  renderForm: (form: FormT, set: (patch: Partial<FormT>) => void, ctx: { isEdit: boolean }) => ReactNode;
  onCreate: (form: FormT) => Promise<void>;
  onUpdate: (id: number, form: FormT) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  canWrite: boolean;
  searchPlaceholder?: string;
}

export function CrudSection<T, FormT>(props: CrudSectionProps<T, FormT>) {
  const {
    title, description, items, loading, error, onReload, columns, search,
    getId, getName, blankForm, toForm, validate, renderForm,
    onCreate, onUpdate, onDelete, canWrite, searchPlaceholder,
  } = props;

  const { toast } = useToast();
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [form, setForm]                 = useState<FormT>(blankForm());
  const [submitting, setSubmitting]     = useState(false);

  const set = useCallback((patch: Partial<FormT>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setForm(blankForm());
    setDialogOpen(true);
  }, [blankForm]);

  const openEdit = useCallback((item: T) => {
    setEditTarget(item);
    setForm(toForm(item));
    setDialogOpen(true);
  }, [toForm]);

  // Build ColumnDef[] from CrudColumn[] + actions column
  const tableColumns = useMemo((): ColumnDef<T>[] => {
    const cols: ColumnDef<T>[] = columns.map((col, i) => ({
      id: `col_${i}`,
      header: col.header,
      cell: ({ row }) => col.cell(row.original),
      enableSorting: false,
    }));

    cols.push({
      id: "__actions__",
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          {canWrite ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" /> Tahrirlash
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> O'chirish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    });

    return cols;
  }, [columns, canWrite, openEdit]);

  // Custom global filter using the `search` prop
  const filterFn = useCallback<FilterFn<T>>(
    (row, _columnId, value: string) =>
      search(row.original).toLowerCase().includes(value.toLowerCase()),
    [search],
  );

  const run = async (fn: () => Promise<void>, okMsg: string): Promise<boolean> => {
    setSubmitting(true);
    try {
      await fn();
      toast({ title: okMsg });
      await onReload();
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: err instanceof Error ? err.message : "Amal bajarilmadi",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    const validationError = validate?.(form);
    if (validationError) {
      toast({ variant: "destructive", title: "Xatolik", description: validationError });
      return;
    }
    const ok = await run(
      async () => {
        if (editTarget) await onUpdate(getId(editTarget), form);
        else await onCreate(form);
      },
      editTarget ? "Yangilandi" : "Qo'shildi",
    );
    if (ok) setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await run(() => onDelete(getId(deleteTarget)), "O'chirildi");
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {canWrite && (
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Qo'shish
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onReload}>
            <RefreshCw className="mr-2 h-4 w-4" /> Qayta urinish
          </Button>
        </div>
      ) : (
        <DataTable
          columns={tableColumns}
          data={items}
          searchPlaceholder={searchPlaceholder ?? "Qidirish..."}
          filterFn={filterFn}
          emptyText="Ma'lumot topilmadi"
          defaultPageSize={20}
        />
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `${getName(editTarget)} — tahrirlash` : `Yangi ${title.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>Maydonlarni to'ldiring. * majburiy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {renderForm(form, set, { isEdit: !!editTarget })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? "Saqlanmoqda..." : editTarget ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirilsinmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `"${getName(deleteTarget)}" o'chiriladi. Bu amalni qaytarib bo'lmaydi.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={submitting}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** List yuklash + holatni boshqaruvchi kichik hook. */
export function useCrudData<T>(queryKey: QueryKey, loader: () => Promise<T[]>) {
  const { data, isLoading, error, refetch } = useQuery<T[]>({
    queryKey,
    queryFn: loader,
    staleTime: 30_000,
  });

  return {
    items: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? "Yuklab bo'lmadi" : null,
    reload: refetch as () => Promise<unknown>,
  };
}
