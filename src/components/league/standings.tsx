'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react'

interface StandingsTeam {
  membershipId: number
  team: {
    id: number
    name: string
    owner: string
  }
  wins: number
  losses: number
  ties: number
  pointsFor: number
  pointsAgainst: number
}

interface StandingsProps {
  leagueId: number
  playoffTeams?: number
}

export function Standings({ leagueId, playoffTeams = 6 }: StandingsProps) {
  const [standings, setStandings] = useState<StandingsTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStandings()
  }, [leagueId])

  const fetchStandings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/league/${leagueId}/standings`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch standings')
      }
      
      const data = await response.json()
      setStandings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load standings')
    } finally {
      setIsLoading(false)
    }
  }

  const getWinPercentage = (wins: number, losses: number, ties: number) => {
    const totalGames = wins + losses + ties
    if (totalGames === 0) return 0
    return ((wins + ties * 0.5) / totalGames) * 100
  }

  const getPlayoffStatus = (position: number) => {
    if (position === 1) return 'first-seed'
    if (position <= playoffTeams) return 'playoff'
    return 'eliminated'
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return <span className="w-4 text-center text-sm font-bold">{position}</span>
    }
  }

  const getPlayoffBadge = (status: string) => {
    switch (status) {
      case 'first-seed':
        return (
          <Badge variant="default" className="gap-1 bg-yellow-500">
            <Trophy className="h-3 w-3" />
            1st Seed
          </Badge>
        )
      case 'playoff':
        return (
          <Badge variant="secondary" className="gap-1 bg-green-500 text-white">
            <TrendingUp className="h-3 w-3" />
            Playoff
          </Badge>
        )
      case 'eliminated':
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <TrendingDown className="h-3 w-3" />
            Eliminated
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>League Standings</CardTitle>
        <CardDescription>
          Current season standings and playoff picture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Team</div>
            <div className="col-span-2 text-center">Record</div>
            <div className="col-span-1 text-center">Win%</div>
            <div className="col-span-2 text-center">Points</div>
            <div className="col-span-2 text-center">Status</div>
          </div>

          {/* Teams */}
          {standings.map((team, index) => {
            const position = index + 1
            const playoffStatus = getPlayoffStatus(position)
            const winPct = getWinPercentage(team.wins, team.losses, team.ties)
            const record = team.ties > 0 ? 
              `${team.wins}-${team.losses}-${team.ties}` : 
              `${team.wins}-${team.losses}`

            return (
              <div
                key={team.membershipId}
                className={cn(
                  "grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-colors hover:bg-accent",
                  playoffStatus === 'first-seed' && "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800",
                  playoffStatus === 'playoff' && "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  {getPositionIcon(position)}
                </div>

                {/* Team */}
                <div className="col-span-4 flex flex-col">
                  <span className="font-medium">{team.team.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {team.team.owner}
                  </span>
                </div>

                {/* Record */}
                <div className="col-span-2 text-center">
                  <span className="font-medium">{record}</span>
                </div>

                {/* Win % */}
                <div className="col-span-1 text-center">
                  <span className="font-medium">{winPct.toFixed(1)}%</span>
                </div>

                {/* Points */}
                <div className="col-span-2 text-center">
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {team.pointsFor.toFixed(1)}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      {team.pointsAgainst.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center justify-center">
                  {getPlayoffBadge(playoffStatus)}
                </div>
              </div>
            )
          })}

          {standings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No teams in this league yet
            </div>
          )}
        </div>

        {/* Playoff Line */}
        {standings.length > playoffTeams && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-px bg-green-500 w-4" />
              <span>Playoff Line</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs">
                Top {playoffTeams} teams make playoffs
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
