"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "../button"
import React from "react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "../dropdown-menu"
import { Columns } from "lucide-react"
import { Input } from "../input"
import { PlayerWishlist } from "@/lib/db/schema/wishlist"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  wishlist: PlayerWishlist[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  wishlist,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    player: true,
    team: true,
    position: true,
    projectedFpts: true,
    fptsTotal: true,
    fpts: true,
    games: true,
    gamesStarted: false,
    minutesPlayed: false,
    assists: false,
    totalRebounds: false,
    steals: false,
    blocks: false,
    points: false,
    drafted: true,
    actions: true,
  })
  
  // Manage wishlist state locally for real-time updates
  const [localWishlist, setLocalWishlist] = React.useState<PlayerWishlist[]>(wishlist)
  
  // Update local state when prop changes (e.g., on page refresh)
  React.useEffect(() => {
    setLocalWishlist(wishlist)
  }, [wishlist])
  
  // Function to add a player to the local wishlist
  const addToLocalWishlist = React.useCallback((newWishlistItem: PlayerWishlist) => {
    setLocalWishlist((prev) => [...prev, newWishlistItem])
  }, [])
  
  // Function to remove a player from the local wishlist
  const removeFromLocalWishlist = React.useCallback((playerId: string) => {
    setLocalWishlist((prev) => prev.filter((w) => w.playerId !== playerId))
  }, [])
  
  // Create a Set of wishlist player IDs for fast lookup
  const wishlistPlayerIds = React.useMemo(
    () => new Set(localWishlist.map((w) => w.playerId)),
    [localWishlist]
  )
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 50,
      },
    },
    enableColumnResizing: true,
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      addToWishlist: addToLocalWishlist,
      removeFromWishlist: removeFromLocalWishlist,
    },
  })

  // Helper function to format column id into readable label
  const formatColumnLabel = (columnId: string): string => {
    const labelMap: Record<string, string> = {
      player: "Player",
      team: "Team",
      position: "Position",
      projectedFpts: "Proj Fpts",
      fptsTotal: "Fpts Total",
      fpts: "Fpts Avg",
      games: "Games",
      gamesStarted: "Started",
      minutesPlayed: "Minutes Played",
      assists: "Asts",
      totalRebounds: "Rebs",
      steals: "Stls",
      blocks: "Blks",
      points: "Pts",
      drafted: "Drafted",
      actions: "Actions",
    };
    return labelMap[columnId] || columnId;
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Filter players..."
          value={(table.getColumn("player")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("player")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-auto">
              <Columns />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {table.getAllColumns().map((column) => (
              <DropdownMenuItem 
                key={column.id}
                onSelect={(e) => e.preventDefault()}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={column.getIsVisible()}
                    disabled={!column.getCanHide()}
                    onChange={column.getToggleVisibilityHandler()}
                    type="checkbox"
                    className="cursor-pointer"
                  />
                  {formatColumnLabel(column.id)}
                </label>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 rounded-md border overflow-auto">
        <table className="w-full caption-bottom text-sm relative">
          <TableHeader className="sticky top-0 bg-background z-10 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-background">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                // Check if this player is on the wishlist
                const playerId = (row.original as any).playerId
                const isOnWishlist = playerId && wishlistPlayerIds.has(playerId)
                
                return (
                  <TableRow
                    className={cn(
                      isOnWishlist 
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30" 
                        : row.index % 2 === 0 
                          ? "bg-muted" 
                          : "bg-background"
                    )}
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}