import { stackServerApp } from "@/stack/server";
import { getFantasyTeamsByOwner } from "@/lib/actions/fantasy-teams";
import CreateTeam from "./create-team";

export default async function Team() {
    const user = await stackServerApp.getUser({ or: "redirect" });
    const fantasyTeams = await getFantasyTeamsByOwner(user.id, 2025);

    return (
        <div className="flex flex-col h-full w-full p-8 pt-18">
            {fantasyTeams.length === 0 ? (
                <CreateTeam userId={user.id} />
            ) : (
                <div className="w-full max-w-4xl space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold">Your Fantasy Teams</h1>
                        <p className="text-muted-foreground mt-2">Season 2025</p>
                    </div>
                    
                    <div className="grid gap-4">
                        {fantasyTeams.map((team) => (
                            <div
                                key={team.id}
                                className="border rounded-lg p-6 hover:bg-accent transition-colors"
                            >
                                <h2 className="text-xl font-semibold">{team.name}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Created: {new Date(team.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}