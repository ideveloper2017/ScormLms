"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  pageSizes?: number[]
  defaultPageSize?: number
  showColumnToggle?: boolean
  emptyText?: string
  toolbar?: React.ReactNode
  className?: string
  filterFn?: FilterFn<TData>
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  pageSizes = [10, 20, 50, 100],
  defaultPageSize = 10,
  showColumnToggle = false,
  emptyText = "Ma'lumot topilmadi",
  toolbar,
  className,
  filterFn,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: filterFn,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
  })

  const hasToolbar = searchPlaceholder !== undefined || showColumnToggle || toolbar
  const hasFooter = table.getAllColumns().some((col) => col.columnDef.footer)

  return (
    <div className={cn("space-y-4", className)}>
      {hasToolbar && (
        <div className="flex items-center gap-3">
          {searchPlaceholder !== undefined && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {toolbar}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto gap-1">
                  Ustunlar <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    >
                      {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-0.5 hover:text-foreground transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="ml-1 h-3.5 w-3.5 shrink-0" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="ml-1 h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <ArrowUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {hasFooter && (
            <TableFooter>
              {table.getFooterGroups().map((fg) => (
                <TableRow key={fg.id} className="bg-muted/30 font-medium">
                  {fg.headers.map((header) => (
                    <TableCell key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.footer, header.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sahifada:</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((s) => (
                <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {table.getFilteredRowModel().rows.length} ta yozuv
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="mr-1 whitespace-nowrap">
            {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}