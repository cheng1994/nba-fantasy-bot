import { fetchNbaStats } from "@/lib/actions/nba-stats";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table/data-table";

export default async function Players() {
    const players = await fetchNbaStats({
        season: 2025,
        limit: 500,
        orderBy: 'fpts',
        orderDirection: 'desc',
        offset: 0,
    });

    console.log(players);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 pt-18">
            <h1 className="text-4xl font-bold mb-4">NBA Players</h1>
            <p className="text-muted-foreground text-center max-w-2xl mb-4">
                Player statistics and information coming soon. Use the chat to ask about specific players!
            </p>
            <DataTable columns={columns} data={players} />
            
        </div>
    )
}