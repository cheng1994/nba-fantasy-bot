"use client";

import { ColumnDef, createColumnHelper, Table } from "@tanstack/react-table";
import { NbaStats } from "@/lib/db/schema/nba-stats";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, Heart, Trash } from "lucide-react";
import { addPlayerToRoster, getFantasyTeam, getFantasyTeamsByOwner, getTeamRoster } from "@/lib/actions/fantasy-teams";
import { Position, TeamRoster } from "@/lib/db";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { addToWishlist, removeFromWishlist } from "@/lib/actions/wishlist";
import { PlayerWishlist } from "@/lib/db/schema/wishlist";

// Extend the TableMeta type to include our custom methods
declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        addToWishlist?: (item: PlayerWishlist) => void;
        removeFromWishlist?: (playerId: string) => void;
    }
}

export interface ColumnVisibility {
    player: boolean;
    team: boolean;
    position: boolean;
    projectedFpts: boolean;
    fptsTotal: boolean;
    fpts: boolean;
    games: boolean;
    gamesStarted: boolean;
    minutesPlayed: boolean;
    assists: boolean;
    totalRebounds: boolean;
    steals: boolean;
    blocks: boolean;
    points: boolean;
    drafted: boolean;
    actions: boolean;
}

export const splitEligiblePositions = (eligiblePositions: string) => {
    return eligiblePositions.split(",");
}

export const getDesignatedPosition = (teamRoster: TeamRoster[], eligiblePositions: string[]) => {
    // Get all currently filled positions on the team
    const filledPositions = new Set(teamRoster.map(r => r.designatedPosition));
    
    // Find the first eligible position that is not already filled
    const availablePosition = eligiblePositions.find(pos => !filledPositions.has(pos));
    
    // If an available position is found, return it
    if (availablePosition) {
        return availablePosition;
    }
    
    // If all eligible positions are filled, return the first eligible position
    // (this will cause an error in the addPlayerToRoster function, which is appropriate)
    return eligiblePositions[0];
}

// Custom hook to handle adding players to roster
export function useAddPlayer() {
    const user = useUser({ or: "return-null" });

    const addPlayer = async (player: NbaStats) => {
        if (!user) {
            toast.error("You must be logged in to add players");
            return;
        }

        try {
            const teams = await getFantasyTeamsByOwner(user.id, 2025);
            if (teams.length === 0) {
                toast.error("You need to create a fantasy team first");
                return;
            }

            const team = teams[0];
            const teamRoster = await getTeamRoster(team.id);
            
            if (teamRoster.length >= 13) {
                toast.error("Your team roster is full (maximum 13 players)");
                return;
            }

            // Check if player is already on the team
            const isPlayerAlreadyOnTeam = teamRoster.some(
                rosterSpot => rosterSpot.playerId === player.playerId
            );
            
            if (isPlayerAlreadyOnTeam) {
                toast.error("Player is already on your team");
                return;
            }

            const eligiblePositions = splitEligiblePositions(player.position || "");
            const designatedPosition = getDesignatedPosition(teamRoster, eligiblePositions);
            
            const response = await addPlayerToRoster({
                teamId: team.id,
                playerId: player.playerId || "",
                designatedPosition: designatedPosition as Position,
                eligiblePositions: eligiblePositions.join(","),
                rosterOrder: teamRoster.length + 1,
            });

            console.log("Player added to team", response);
            toast.success(`${player.player} has been added to your team!`);
        } catch (error) {
            console.error("Error adding player to team", error);
            toast.error("Failed to add player to team. Please try again.");
        }
    };

    return { addPlayer, user };
}

export function useWishlist() {
    const user = useUser({ or: "return-null" });

    const addPlayerToWishlist = async (player: NbaStats) => {
        if (!user) {
            toast.error("You must be logged in to add players to your wishlist");
            return null;
        }

        try {
            const response = await addToWishlist({
                owner: user.id,
                playerId: player.playerId,
                season: 2025,
                priority: 1,
                notes: "Add to wishlist",
            });

            console.log("Player added to wishlist", response);
            toast.success(`${player.player} has been added to your wishlist!`);
            return response;
        } catch (error) {
            console.error("Error adding player to wishlist", error);
            toast.error("Failed to add player to wishlist. Please try again.");
            return null;
        }
    };

    const removePlayerFromWishlist = async (player: NbaStats) => {
        if (!user) {
            toast.error("You must be logged in to remove players from your wishlist");
            return null;
        }

        try {
            const response = await removeFromWishlist({
                owner: user.id,
                playerId: player.playerId,
                season: 2025,
            });
            toast.success(`${player.player} has been removed from your wishlist!`);
            return response;
        } catch (error) {
            console.error("Error removing player from wishlist", error);
            toast.error("Failed to remove player from wishlist. Please try again.");
            return null;
        }
    };

    return { addPlayerToWishlist, removePlayerFromWishlist, user };
}

// Component to handle actions for each row
function ActionsCell({ player, table }: { player: NbaStats; table: Table<NbaStats> }) {
    const { addPlayer, user } = useAddPlayer();
    const { addPlayerToWishlist, removePlayerFromWishlist } = useWishlist();

    const handleAddPlayer = async () => {
        await addPlayer(player);
    };
    
    const handleViewPlayer = () => {
        console.log("View Player", player.player);
    };

    const handleAddPlayerToWishlist = async () => {
        const response = await addPlayerToWishlist(player);
        
        // Update the local wishlist in the table if successful
        if (response?.data && table.options.meta?.addToWishlist) {
            table.options.meta.addToWishlist(response.data);
        }
    };

    const handleRemovePlayerFromWishlist = async () => {
        const response = await removePlayerFromWishlist(player);
        if (response?.success && table.options.meta?.removeFromWishlist) {
            table.options.meta.removeFromWishlist(player.playerId);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleAddPlayerToWishlist}>
                    <Heart className="h-4 w-4" />
                    Add to Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRemovePlayerFromWishlist}>
                    <Trash className="h-4 w-4" />
                    Remove from Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={handleAddPlayer}
                    disabled={!user}
                >
                    Add Player
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewPlayer}>
                    View Player
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns: ColumnDef<NbaStats>[] = [
    {
        accessorKey: "player",
        header: "Player",
        filterFn: 'includesString'
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
        accessorKey: "projectedFpts",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Proj Fpts" />
        )
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
            <DataTableColumnHeader column={column} title="Pts" />
        ),
        cell: ({ row }) => {
            const games = row.original.games || 0;
            return <div>{row.original.points ? (row.original.points / games).toFixed(2) : 0}</div>
        }
    },
    {
        accessorKey: "games",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Games" />
        )
    },
    {
        accessorKey: "gamesStarted",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Started" />
        )
    },
    {
        accessorKey: "minutesPlayed",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Minutes Played" />
        ),
        cell: ({ row }) => {
            const games = row.original.games || 0;
            return <div>{row.original.minutesPlayed ? (row.original.minutesPlayed / games).toFixed(2) : 0}</div>
        }
    },
    {
        accessorKey: "assists",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Asts" />
        ),
        cell: ({ row }) => {
            const games = row.original.games || 0;
            return <div>{row.original.assists ? (row.original.assists / games).toFixed(2) : 0}</div>
        }
    },
    {
        accessorKey: "totalRebounds",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Rebs" />
        ),
        cell: ({ row }) => {
            const games = row.original.games || 0;
            return <div>{row.original.totalRebounds ? (row.original.totalRebounds / games).toFixed(2) : 0}</div>
        }
    },
    {
        accessorKey: "steals",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Stls" />
        ),
        cell: ({ row }) => {
            const games = row.original.games || 0;
            return <div>{row.original.steals ? (row.original.steals / games).toFixed(2) : 0}</div>
        }
    },
    {
        accessorKey: "blocks",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Blks" />
        ),
        cell: ({ row }) => {
            const games = row.original.games || 0;
            return <div>{row.original.blocks ? (row.original.blocks / games).toFixed(2) : 0}</div>
        }
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
        cell: ({ row, table }) => {
            return <ActionsCell player={row.original} table={table} />;
        }
    }
];