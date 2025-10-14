import { Button } from "@/components/ui/button";
import { createFantasyTeam } from "@/lib/actions/fantasy-teams";

export default async function Team() {
    const team = await createFantasyTeam({})
    return (
        <>
            <h1>Team</h1>
            <Button>Create Team</Button>
        </>
    )
}