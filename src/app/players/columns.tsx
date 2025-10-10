"use client";

import { ColumnDef } from "@tanstack/react-table";
import { NbaStats } from "@/lib/db/schema/nba-stats";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";

export const columns: ColumnDef<NbaStats>[] = [
    {
        accessorKey: "player",
        header: "Player",
    },
    {
        accessorKey: "team",
        header: "Team",
    },
    {
        accessorKey: "position",
        header: "Position",
    },
    {
        accessorKey: "fptsTotal",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Fpts Total" />
        )
    },
    {
        accessorKey: "fpts",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Fpts Avg" />
        )
    },
    {
        accessorKey: "points",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Points" />
        )
    },
    {
        accessorKey: "assists",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Assists" />
        )
    },
    {
        accessorKey: "totalRebounds",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Rebounds" />
        )
    },
    {
        accessorKey: "steals",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Steals" />
        )
    },
    {
        accessorKey: "blocks",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Blocks" />
        )
    },
    {
        accessorKey: "turnovers",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Turnovers" />
        )
    },
    {
        accessorKey: "personalFouls",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Fouls" />
        )
    },
    {
        accessorKey: "drafted",
        header: "Drafted",
        cell: ({ row }) => {
            const [drafted, setDrafted] = useState(row.original.drafted || false);

            const handleDraftedChange = async () => {
                const response = await fetch(`/api/nba-stats`, {
                    method: "PUT",
                    body: JSON.stringify({ id: row.original.id, drafted: !drafted }),
                });
                const data = await response.json();
                setDrafted(data.data.drafted);
            }
            
            return (
                <Switch checked={drafted} onCheckedChange={handleDraftedChange} />
            )
        }
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost">
                            <Ellipsis />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                            Add Player
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            View Player
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
];