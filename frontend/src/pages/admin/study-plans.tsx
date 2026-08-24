import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  BookMarked,
  BookOpenCheck,
  Eye,
  Layers3,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  curriculumApi,
  type CurriculumStatus,
  type CurriculumVersion,
} from "@/services/api/curriculum-api";

const ALL = "__all__";

function StatusBadge({ status }: { status: CurriculumStatus }) {
  if (status === "APPROVED") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Tasdiqlangan</Badge>;
  }
  if (status === "ARCHIVED") {
    return <Badge variant="outline">Arxivlangan</Badge>;
  }
  return <Badge variant="secondary">Qoralama</Badge>;
}

export function AdminStudyPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [academicYear, setAcademicYear] = useState<string>(ALL);
  const curricula = useQuery({ queryKey: ["curricula"], queryFn: curriculumApi.list });

  const items = curricula.data ?? [];
  const years = useMemo(
    () => Array.from(new Set(items.map((item) => item.academicYear))).sort().reverse(),
    [items],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("uz");
    return items.filter((item) => {
      const matchesTerm =
        !term ||
        item.programName.toLocaleLowerCase("uz").includes(term) ||
        item.versionCode.toLocaleLowerCase("uz").includes(term) ||
        item.academicYear.includes(term);
      return (
        matchesTerm &&
        (status === ALL || item.status === status) &&
        (academicYear === ALL || item.academicYear === academicYear)
      );
    });
  }, [academicYear, items, search, status]);

  const columns = useMemo<ColumnDef<CurriculumVersion>[]>(
    () => [
      {
        id: "program",
        header: "Ta'lim yo'nalishi va versiya",
        accessorFn: (item) => item.programName + " " + item.versionCode,
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="font-medium">{row.original.programName}</p>
            <p className="text-xs text-muted-foreground">Versiya: {row.original.versionCode}</p>
          </div>
        ),
      },
      { accessorKey: "academicYear", header: "O'quv yili" },
      {
        accessorKey: "status",
        header: "Holati",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "load",
        header: "Fanlar / kredit",
        accessorFn: (item) => item.subjectCount,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.subjectCount} ta fan</p>
            <p className="text-xs text-muted-foreground">{row.original.totalCredits} kredit</p>
          </div>
        ),
      },
      {
        id: "validity",
        header: "Amal qilish davri",
        accessorFn: (item) => item.validFrom,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.validFrom} — {row.original.validUntil}
          </span>
        ),
      },
      {
        id: "approval",
        header: "Tasdiqlash",
        accessorFn: (item) => item.approvalOrderNumber ?? "",
        cell: ({ row }) =>
          row.original.approvalOrderNumber ? (
            <div>
              <p className="text-sm font-medium">{row.original.approvalOrderNumber}</p>
              <p className="text-xs text-muted-foreground">{row.original.approvalOrderDate}</p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Kutilmoqda</span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/edu-process/curriculum/" + row.original.id)}
            >
              {row.original.status === "DRAFT" && canWrite ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {row.original.status === "DRAFT" && canWrite ? "Davom ettirish" : "Ko'rish"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Biriktirilgan talabalar"
              aria-label="Biriktirilgan talabalar"
              onClick={() =>
                navigate("/edu-process/attached-students?curriculumId=" + row.original.id)
              }
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [canWrite, navigate],
  );

  const stats = {
    total: items.length,
    draft: items.filter((item) => item.status === "DRAFT").length,
    approved: items.filter((item) => item.status === "APPROVED").length,
    archived: items.filter((item) => item.status === "ARCHIVED").length,
  };

  if (curricula.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">O'quv rejalar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rejalarni qidiring, holatini kuzating yoki yangi reja yarating.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => navigate("/edu-process/curriculum/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi o'quv reja
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Jami rejalar", value: stats.total, icon: Layers3 },
          { label: "Qoralama", value: stats.draft, icon: BookMarked },
          { label: "Tasdiqlangan", value: stats.approved, icon: BookOpenCheck },
          { label: "Arxivlangan", value: stats.archived, icon: Archive },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-4 sm:p-5">
              <div>
                <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-muted-foreground/60" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Qidirish va saralash</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Yo'nalish yoki versiya bo'yicha qidiring"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Holat bo'yicha saralash">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha holatlar</SelectItem>
              <SelectItem value="DRAFT">Qoralama</SelectItem>
              <SelectItem value="APPROVED">Tasdiqlangan</SelectItem>
              <SelectItem value="ARCHIVED">Arxivlangan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger aria-label="O'quv yili bo'yicha saralash">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha o'quv yillari</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {curricula.isError ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-destructive">O'quv rejalarni yuklab bo'lmadi.</p>
            <Button variant="outline" onClick={() => curricula.refetch()}>
              Qayta urinish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={filtered}
              defaultPageSize={10}
              emptyText="Tanlangan filtrlar bo'yicha o'quv reja topilmadi"
            />
          </div>
          <div className="space-y-3 md:hidden">
            {filtered.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.programName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.versionCode} · {item.academicYear}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/40 p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Fanlar</p>
                      <p className="font-medium">{item.subjectCount} ta</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kredit</p>
                      <p className="font-medium">{item.totalCredits}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => navigate("/edu-process/curriculum/" + item.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ochish
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Biriktirilgan talabalar"
                      onClick={() =>
                        navigate("/edu-process/attached-students?curriculumId=" + item.id)
                      }
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Tanlangan filtrlar bo'yicha o'quv reja topilmadi.
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
