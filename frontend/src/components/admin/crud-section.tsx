import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Search, Trash2, Pencil, MoreHorizontal, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
  /** Qidiruv uchun matn (lowercase qilinadi) */
  search: (item: T) => string;
  getId: (item: T) => number;
  /** O'chirish/tahrirlash dialogi sarlavhasi uchun */
  getName: (item: T) => string;
  blankForm: () => FormT;
  toForm: (item: T) => FormT;
  /** Xato matni qaytarsa, saqlash to'xtaydi */
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
  const [searchText, setSearchText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [form, setForm] = useState<FormT>(blankForm());
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback((patch: Partial<FormT>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => search(it).toLowerCase().includes(q));
  }, [items, searchText, search]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(blankForm());
    setDialogOpen(true);
  };
  const openEdit = (item: T) => {
    setEditTarget(item);
    setForm(toForm(item));
    setDialogOpen(true);
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Qo'shish
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder ?? "Qidirish..."}
          className="pl-10"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Jami: {filtered.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={onReload}>
                <RefreshCw className="mr-2 h-4 w-4" /> Qayta urinish
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.header} className={col.className}>{col.header}</TableHead>
                    ))}
                    <TableHead className="w-12 text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="py-10 text-center text-muted-foreground">
                        Ma'lumot topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => (
                      <TableRow key={getId(item)}>
                        {columns.map((col) => (
                          <TableCell key={col.header} className={col.className}>{col.cell(item)}</TableCell>
                        ))}
                        <TableCell className="text-right">
                          {canWrite && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(item)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Tahrirlash
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(item)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> O'chirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? `${getName(editTarget)} — tahrirlash` : `Yangi ${title.toLowerCase()}`}</DialogTitle>
            <DialogDescription>Maydonlarni to'ldiring. * majburiy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">{renderForm(form, set, { isEdit: !!editTarget })}</div>
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

      {/* Delete */}
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

/** List yuklash + holatni boshqaruvchi kichik hook (har sahifa qayta ishlatadi). */
export function useCrudData<T>(loader: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await loader());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { items, loading, error, reload };
}
