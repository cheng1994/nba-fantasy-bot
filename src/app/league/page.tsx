import { LeagueDashboard } from "@/components/league"
import { getFantasyTeamsByOwner } from "@/lib/actions/fantasy-teams";
import { stackServerApp } from "@/stack/server";
import CreateTeam from "../team/create-team";
import { getUserLeagues } from "@/lib/actions/league";

export default async function LeaguePage() {
    const user = await stackServerApp.getUser({ or: "redirect" });
    const leagues = await getUserLeagues(user.id, 2025);

    return (
        <div className="flex flex-col h-full w-full p-8 pt-18">
            {leagues.length === 0 ? (
                <div>
                    <h1 className="text-3xl font-bold">No fantasy leagues found</h1>
                    <p className="text-muted-foreground">Create a fantasy league to get started</p>
                    <CreateTeam userId={user.id} />
                </div>
            ) : (
                <LeagueDashboard leagueId={1} weekNumber={1} />
            )}
        </div>
    )
}