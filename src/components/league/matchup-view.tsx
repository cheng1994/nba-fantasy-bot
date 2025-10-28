'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Trophy, Clock, Lock, Users } from 'lucide-react'

interface MatchupTeam {
  membership: {
    id: number
    wins: number
    losses: number
    ties: number
  }
  team: {
    id: number
    name: string
    owner: string
  }
}

interface MatchupLineup {
  id: number
  teamId: number
  totalPoints?: number
  isLocked: boolean
  lockedAt?: string
  pgPlayerId?: string
  sgPlayerId?: string
  sfPlayerId?: string
  pfPlayerId?: string
  cPlayerId?: string
  gPlayerId?: string
  fPlayerId?: string
  util1PlayerId?: string
  util2PlayerId?: string
  benchPlayerIds?: string[]
}

interface MatchupData {
  id: number
  weekNumber: number
  season: number
  team1Score?: number
  team2Score?: number
  winnerId?: number
  status: 'upcoming' | 'locked' | 'in_progress' | 'final'
  isPlayoffMatchup: boolean
  team1: MatchupTeam
  team2: MatchupTeam
  team1Lineup?: MatchupLineup
  team2Lineup?: MatchupLineup
}

interface MatchupViewProps {
  matchupId: number
}

export function MatchupView({ matchupId }: MatchupViewProps) {
  const [matchup, setMatchup] = useState<MatchupData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatchup()
  }, [matchupId])

  const fetchMatchup = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/league/matchup/${matchupId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch matchup')
      }
      
      const data = await response.json()
      setMatchup(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matchup')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500'
      case 'locked':
        return 'bg-orange-500'
      case 'in_progress':
        return 'bg-yellow-500'
      case 'final':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming'
      case 'locked':
        return 'Locked'
      case 'in_progress':
        return 'In Progress'
      case 'final':
        return 'Final'
      default:
        return status
    }
  }

  const formatRecord = (wins: number, losses: number, ties: number) => {
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`
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

  if (error || !matchup) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive">{error || 'Matchup not found'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isTeam1Winner = matchup.winnerId === matchup.team1.membership.id
  const isTeam2Winner = matchup.winnerId === matchup.team2.membership.id
  const isTie = matchup.status === 'final' && !matchup.winnerId

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Week {matchup.weekNumber} Matchup
                {matchup.isPlayoffMatchup && (
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    Playoff
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Season {matchup.season}
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={cn("gap-1", getStatusColor(matchup.status), "text-white")}
            >
              <Clock className="h-3 w-3" />
              {getStatusText(matchup.status)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Matchup */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Team 1 */}
            <div className={cn(
              "text-center p-6 rounded-lg border-2 transition-colors",
              isTeam1Winner ? "border-green-500 bg-green-50 dark:bg-green-950" :
              isTeam2Winner ? "border-gray-300 bg-gray-50 dark:bg-gray-900" :
              "border-gray-300"
            )}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-xl font-bold">{matchup.team1.team.name}</h3>
                {isTeam1Winner && <Trophy className="h-5 w-5 text-green-500" />}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {formatRecord(matchup.team1.membership.wins, matchup.team1.membership.losses, matchup.team1.membership.ties)}
              </p>
              
              {/* Score */}
              <div className="text-4xl font-bold mb-2">
                {matchup.team1Score?.toFixed(1) || '0.0'}
              </div>
              
              {/* Lineup Status */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {matchup.team1Lineup?.isLocked ? (
                  <>
                    <Lock className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Locked</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-500">Setting Lineup</span>
                  </>
                )}
              </div>
            </div>

            {/* VS Separator */}
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Separator className="flex-1" />
                <span className="px-4 text-2xl font-bold text-muted-foreground">VS</span>
                <Separator className="flex-1" />
              </div>
              {isTie && matchup.status === 'final' && (
                <Badge variant="outline" className="mt-2">
                  Tie Game
                </Badge>
              )}
            </div>

            {/* Team 2 */}
            <div className={cn(
              "text-center p-6 rounded-lg border-2 transition-colors",
              isTeam2Winner ? "border-green-500 bg-green-50 dark:bg-green-950" :
              isTeam1Winner ? "border-gray-300 bg-gray-50 dark:bg-gray-900" :
              "border-gray-300"
            )}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-xl font-bold">{matchup.team2.team.name}</h3>
                {isTeam2Winner && <Trophy className="h-5 w-5 text-green-500" />}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {formatRecord(matchup.team2.membership.wins, matchup.team2.membership.losses, matchup.team2.membership.ties)}
              </p>
              
              {/* Score */}
              <div className="text-4xl font-bold mb-2">
                {matchup.team2Score?.toFixed(1) || '0.0'}
              </div>
              
              {/* Lineup Status */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {matchup.team2Lineup?.isLocked ? (
                  <>
                    <Lock className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Locked</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-500">Setting Lineup</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lineup Details */}
      {(matchup.team1Lineup || matchup.team2Lineup) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team 1 Lineup */}
          {matchup.team1Lineup && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {matchup.team1.team.name} Lineup
                  {matchup.team1Lineup.isLocked && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LineupDisplay lineup={matchup.team1Lineup} />
              </CardContent>
            </Card>
          )}

          {/* Team 2 Lineup */}
          {matchup.team2Lineup && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {matchup.team2.team.name} Lineup
                  {matchup.team2Lineup.isLocked && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LineupDisplay lineup={matchup.team2Lineup} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function LineupDisplay({ lineup }: { lineup: MatchupLineup }) {
  const positions = [
    { label: 'PG', key: 'pgPlayerId' },
    { label: 'SG', key: 'sgPlayerId' },
    { label: 'SF', key: 'sfPlayerId' },
    { label: 'PF', key: 'pfPlayerId' },
    { label: 'C', key: 'cPlayerId' },
    { label: 'G', key: 'gPlayerId' },
    { label: 'F', key: 'fPlayerId' },
    { label: 'UTIL', key: 'util1PlayerId' },
    { label: 'UTIL', key: 'util2PlayerId' },
  ]

  return (
    <div className="space-y-3">
      {/* Starting Lineup */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Starting Lineup</h4>
        {positions.map((pos, index) => {
          const playerId = (lineup as any)[pos.key]
          return (
            <div key={`${pos.key}-${index}`} className="flex items-center justify-between p-2 border rounded text-sm">
              <span className="font-medium">{pos.label}</span>
              <span className="text-muted-foreground">
                {playerId ? `Player ${playerId}` : 'Empty'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bench */}
      {lineup.benchPlayerIds && lineup.benchPlayerIds.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Bench ({lineup.benchPlayerIds.length})</h4>
          <div className="text-sm text-muted-foreground">
            {lineup.benchPlayerIds.map((playerId, index) => (
              <div key={playerId} className="p-2 border rounded">
                Player {playerId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Points */}
      {lineup.totalPoints !== undefined && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Points</span>
            <span className="text-lg font-bold">{lineup.totalPoints.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
