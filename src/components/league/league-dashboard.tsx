'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@stackframe/stack'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { LineupManager } from './lineup-manager'
import { MatchupView } from './matchup-view'
import { Standings } from './standings'
import { WaiverWire } from './waiver-wire'
import { cn } from '@/lib/utils'
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  DollarSign,
  TrendingUp,
  Crown,
  Zap 
} from 'lucide-react'

interface LeagueData {
  id: number
  name: string
  season: number
  status: string
  maxTeams: number
  playoffTeams: number
  lineupLockTime: string
  waiverType: string
  teams: Array<{
    membershipId: number
    teamId: number
    team: {
      id: number
      name: string
      owner: string
    }
    wins: number
    losses: number
    ties: number
    faabBudget: number
  }>
  scoring: any
  settings: any
}

interface UserTeamData {
  membership: any
  currentMatchup: any
  weeklyLineup: any
  rosterPlayers: any[]
}

interface LeagueDashboardProps {
  leagueId: number
  weekNumber?: number
}

export function LeagueDashboard({ leagueId, weekNumber = 1 }: LeagueDashboardProps) {
  const user = useUser()
  const [league, setLeague] = useState<LeagueData | null>(null)
  const [userTeam, setUserTeam] = useState<UserTeamData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('lineup')

  useEffect(() => {
    if (user) {
      fetchLeagueData()
    }
  }, [leagueId, user])

  const fetchLeagueData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch league details
      const leagueResponse = await fetch(`/api/league?leagueId=${leagueId}`)
      if (!leagueResponse.ok) throw new Error('Failed to fetch league')
      const leagueData = await leagueResponse.json()
      setLeague(leagueData)
      
      if (user) {
        // Find user's team in this league
        const userMembership = leagueData.teams.find((team: any) => 
          team.team.owner === user.id
        )
        
        if (userMembership) {
          // Fetch user's current matchup and lineup
          const matchupResponse = await fetch(
            `/api/league/team-matchup?leagueId=${leagueId}&teamId=${userMembership.teamId}&weekNumber=${weekNumber}`
          )
          
          const matchupData = matchupResponse.ok ? await matchupResponse.json() : null
          
          setUserTeam({
            membership: userMembership,
            currentMatchup: matchupData,
            weeklyLineup: null, // Will be loaded by LineupManager
            rosterPlayers: [], // Will be loaded separately
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load league')
    } finally {
      setIsLoading(false)
    }
  }

  const getLeagueStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-blue-500'
      case 'active':
        return 'bg-green-500'
      case 'playoffs':
        return 'bg-orange-500'
      case 'completed':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatRecord = (wins: number, losses: number, ties: number) => {
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please sign in to access your league</p>
          </div>
        </CardContent>
      </Card>
    )
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

  if (error || !league) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive">{error || 'League not found'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userTeam) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">You are not a member of this league</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* League Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {league.name}
              </CardTitle>
              <CardDescription>
                Season {league.season} • Week {weekNumber}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("gap-1", getLeagueStatusColor(league.status), "text-white")}
              >
                {league.status.charAt(0).toUpperCase() + league.status.slice(1)}
              </Badge>
              {league.waiverType === 'faab' && (
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${userTeam.membership.faabBudget} FAAB
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Record</p>
                <p className="text-lg font-bold">
                  {formatRecord(
                    userTeam.membership.wins, 
                    userTeam.membership.losses, 
                    userTeam.membership.ties
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Points For</p>
                <p className="text-lg font-bold">
                  {userTeam.membership.pointsFor?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Points Against</p>
                <p className="text-lg font-bold">
                  {userTeam.membership.pointsAgainst?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">League Size</p>
                <p className="text-lg font-bold">
                  {league.teams.length}/{league.maxTeams}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lineup" className="gap-2">
            <Zap className="h-4 w-4" />
            Lineup
          </TabsTrigger>
          <TabsTrigger value="matchup" className="gap-2">
            <Calendar className="h-4 w-4" />
            Matchup
          </TabsTrigger>
          <TabsTrigger value="standings" className="gap-2">
            <Trophy className="h-4 w-4" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="waivers" className="gap-2">
            <Users className="h-4 w-4" />
            Waivers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lineup" className="space-y-4">
          {userTeam.currentMatchup ? (
            <LineupManager
              leagueId={leagueId}
              teamId={userTeam.membership.teamId}
              matchupId={userTeam.currentMatchup.id}
              weekNumber={weekNumber}
              initialLineup={userTeam.weeklyLineup}
              rosterPlayers={userTeam.rosterPlayers}
              onLineupChange={() => {
                // Refresh data
                fetchLeagueData()
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No matchup found for Week {weekNumber}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matchup" className="space-y-4">
          {userTeam.currentMatchup ? (
            <MatchupView matchupId={userTeam.currentMatchup.id} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No matchup found for Week {weekNumber}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="standings" className="space-y-4">
          <Standings 
            leagueId={leagueId} 
            playoffTeams={league.playoffTeams}
          />
        </TabsContent>

        <TabsContent value="waivers" className="space-y-4">
          <WaiverWire
            leagueId={leagueId}
            teamId={userTeam.membership.teamId}
            weekNumber={weekNumber}
            faabBudget={userTeam.membership.faabBudget}
            waiverType={league.waiverType as 'faab' | 'rolling' | 'reverse_standings'}
            rosterPlayers={userTeam.rosterPlayers}
            onTransactionSubmitted={() => {
              // Refresh data
              fetchLeagueData()
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
