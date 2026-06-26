import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { ColumnDef } from "@tanstack/react-table";
import { ScrollText, Search, RefreshCw, AlertTriangle, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAuditLogs, type AuditLogEntry } from "@/lib/rbac-api";

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("uz-Latn", { dateStyle: "short", timeStyle: "short" });
}

const METHOD_CLS: Record<string, string> = {
  GET:    "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300",
  POST:   "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",
  PUT:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  PATCH:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  DELETE: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300",
};

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "username",
    header: "Foydalanuvchi",
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="font-medium text-sm">{val}</span>
        : <span className="text-muted-foreground text-sm">System</span>;
    },
  },
  {
    accessorKey: "action",
    header: "Harakat",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="text-xs font-mono">{getValue<string>()}</Badge>
    ),
  },
  {
    id: "methodUrl",
    header: "Metod / URL",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-xs font-mono text-muted-foreground max-w-[220px] truncate">
        {row.original.method && (
          <Badge className={`${METHOD_CLS[row.original.method] ?? ""} text-xs mr-1 font-mono`}>
            {row.original.method}
          </Badge>
        )}
        {row.original.path}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const val = getValue<number | null>();
      if (val == null) return null;
      return (
        <Badge className={val >= 400 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
          {val}
        </Badge>
      );
    },
  },
  {
    accessorKey: "ip",
    header: "IP",
    cell: ({ getValue }) => (
      <span className="text-xs font-mono text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
    ),
  },
  {
    accessorKey: "timestamp",
    header: "Vaqt",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(getValue<string>())}</span>
    ),
  },
];

export function AdminAuditLogs() {
  const queryClient = useQueryClient();
  const { data: logs = [], isLoading: loading, error: loadError } = useQuery({
    queryKey: qk.auditLogs(),
    queryFn: listAuditLogs,
    staleTime: 30_000,
  });
  const error = loadError instanceof Error ? loadError.message : loadError ? "Loglarni yuklab bo'lmadi" : null;
  const load = () => queryClient.invalidateQueries({ queryKey: qk.auditLogs() });

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => logs.filter((log) => {
    const t = search.trim().toLowerCase();
    const matchSearch = !t ||
      (log.username ?? "").toLowerCase().includes(t) ||
      (log.action ?? "").toLowerCase().includes(t) ||
      (log.path ?? "").toLowerCase().includes(t) ||
      (log.ip ?? "").toLowerCase().includes(t);
    const matchMethod = methodFilter === "all" || log.method === methodFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "2xx" && log.status != null && log.status >= 200 && log.status < 300) ||
      (statusFilter === "4xx" && log.status != null && log.status >= 400 && log.status < 500) ||
      (statusFilter === "5xx" && log.status != null && log.status >= 500);
    return matchSearch && matchMethod && matchStatus;
  }), [logs, search, methodFilter, statusFilter]);

  const methods = useMemo(() => [...new Set(logs.map((l) => l.method).filter(Boolean))], [logs]);

  const stats = useMemo(() => ({
    total:  logs.length,
    errors: logs.filter((l) => l.status != null && l.status >= 400).length,
    users:  new Set(logs.map((l) => l.username).filter(Boolean)).size,
  }), [logs]);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Tizim harakatlari va foydalanuvchi log yozuvlari</p>
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Yangilash">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ScrollText className="h-4 w-4" />Jami loglar
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />Xatoliklar
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.errors}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />Faol foydalanuvchilar
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.users}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Foydalanuvchi, harakat, URL, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Metod" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha metodlar</SelectItem>
            {methods.map((m) => m && <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha statuslar</SelectItem>
            <SelectItem value="2xx">2xx (Muvaffaqiyat)</SelectItem>
            <SelectItem value="4xx">4xx (Mijoz xatosi)</SelectItem>
            <SelectItem value="5xx">5xx (Server xatosi)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {filtered.length} ta log
              {filtered.length !== logs.length && ` (jami: ${logs.length})`}
            </CardTitle>
            <CardDescription>So'nggi {logs.length} ta yozuv</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" />Qayta urinish</Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              defaultPageSize={20}
              emptyText="Log topilmadi"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}