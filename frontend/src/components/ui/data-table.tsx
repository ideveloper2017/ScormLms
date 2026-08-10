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
  serverSearch?: { value: string; onChange: (value: string) => void }
  serverPagination?: {
    pageIndex: number
    pageSize: number
    pageCount: number
    totalElements: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
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
  serverSearch,
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: serverPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: filterFn,
    manualFiltering: !!serverSearch,
    manualPagination: !!serverPagination,
    pageCount: serverPagination?.pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(serverPagination ? { pagination: { pageIndex: serverPagination.pageIndex, pageSize: serverPagination.pageSize } } : {}),
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
                value={serverSearch?.value ?? globalFilter}
                onChange={(e) => serverSearch ? serverSearch.onChange(e.target.value) : setGlobalFilter(e.target.value)}
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
            value={`${serverPagination?.pageSize ?? table.getState().pagination.pageSize}`}
            onValueChange={(v) => serverPagination ? serverPagination.onPageSizeChange(Number(v)) : table.setPageSize(Number(v))}
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
            {serverPagination?.totalElements ?? table.getFilteredRowModel().rows.length} ta yozuv
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="mr-1 whitespace-nowrap">
            {(serverPagination?.pageIndex ?? table.getState().pagination.pageIndex) + 1} / {Math.max(serverPagination?.pageCount ?? table.getPageCount(), 1)}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => serverPagination ? serverPagination.onPageChange(0) : table.setPageIndex(0)} disabled={serverPagination ? serverPagination.pageIndex <= 0 : !table.getCanPreviousPage()}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => serverPagination ? serverPagination.onPageChange(serverPagination.pageIndex - 1) : table.previousPage()} disabled={serverPagination ? serverPagination.pageIndex <= 0 : !table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => serverPagination ? serverPagination.onPageChange(serverPagination.pageIndex + 1) : table.nextPage()} disabled={serverPagination ? serverPagination.pageIndex + 1 >= serverPagination.pageCount : !table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => serverPagination ? serverPagination.onPageChange(Math.max(serverPagination.pageCount - 1, 0)) : table.setPageIndex(table.getPageCount() - 1)} disabled={serverPagination ? serverPagination.pageIndex + 1 >= serverPagination.pageCount : !table.getCanNextPage()}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
