"use client";

import { ColumnDef } from "@tanstack/react-table";
import { NbaStats } from "@/lib/db/schema/nba-stats";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { addPlayerToRoster, getFantasyTeam, getFantasyTeamsByOwner, getTeamRoster } from "@/lib/actions/fantasy-teams";
import { Position, TeamRoster } from "@/lib/db";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";

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

// Component to handle actions for each row
function ActionsCell({ player }: { player: NbaStats }) {
    const { addPlayer, user } = useAddPlayer();

    const handleAddPlayer = async () => {
        await addPlayer(player);
    };
    
    const handleViewPlayer = () => {
        console.log("View Player", player.player);
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
        accessorKey: "assists",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Asts" />
        )
    },
    {
        accessorKey: "totalRebounds",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Rebs" />
        )
    },
    {
        accessorKey: "steals",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Stls" />
        )
    },
    {
        accessorKey: "blocks",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Blks" />
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
            return <ActionsCell player={row.original} />;
        }
    }
];