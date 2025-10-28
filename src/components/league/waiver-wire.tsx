'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@stackframe/stack'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Minus, DollarSign, TrendingUp, Search } from 'lucide-react'

interface WaiverPlayer {
  id: string
  name: string
  team: string
  position: string
  fantasyPoints?: number
  projectedFpts?: number
  gamesPlayed?: number
  averagePoints?: number
  trend?: 'up' | 'down' | 'neutral'
}

interface RosterPlayer {
  id: string
  name: string
  team: string
  position: string
  designatedPosition: string
}

interface WaiverWireProps {
  leagueId: number
  teamId: number
  weekNumber: number
  faabBudget: number
  waiverType: 'faab' | 'rolling' | 'reverse_standings'
  rosterPlayers?: RosterPlayer[]
  onTransactionSubmitted?: () => void
}

export function WaiverWire({
  leagueId,
  teamId,
  weekNumber,
  faabBudget,
  waiverType,
  rosterPlayers = [],
  onTransactionSubmitted,
}: WaiverWireProps) {
  const user = useUser()
  const [availablePlayers, setAvailablePlayers] = useState<WaiverPlayer[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<WaiverPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'team' | 'position' | 'projectedFpts'>('projectedFpts')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Claim states
  const [selectedPlayer, setSelectedPlayer] = useState<WaiverPlayer | null>(null)
  const [playerToDrop, setPlayerToDrop] = useState<string>('')
  const [faabBid, setFaabBid] = useState<number>(0)
  const [actionType, setActionType] = useState<'add' | 'add_drop'>('add')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAvailablePlayers()
  }, [leagueId, teamId])

  useEffect(() => {
    filterAndSortPlayers()
  }, [availablePlayers, searchTerm, positionFilter, sortBy, sortOrder])

  const fetchAvailablePlayers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // This would be a new endpoint to get available players
      const response = await fetch(`/api/league/${leagueId}/available-players?teamId=${teamId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch available players')
      }
      
      const data = await response.json()
      setAvailablePlayers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available players')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortPlayers = () => {
    let filtered = [...availablePlayers]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by position
    if (positionFilter !== 'all') {
      filtered = filtered.filter(player =>
        player.position.includes(positionFilter)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'team':
          aValue = a.team
          bValue = b.team
          break
        case 'position':
          aValue = a.position
          bValue = b.position
          break
        case 'projectedFpts':
          aValue = a.projectedFpts || 0
          bValue = b.projectedFpts || 0
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredPlayers(filtered)
  }

  const openClaimDialog = (player: WaiverPlayer) => {
    setSelectedPlayer(player)
    setPlayerToDrop('')
    setFaabBid(1)
    setActionType(rosterPlayers.length >= 13 ? 'add_drop' : 'add')
  }

  const submitWaiverClaim = async () => {
    if (!selectedPlayer || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      const claimData = {
        leagueId,
        teamId,
        weekNumber,
        actionType,
        playerAddedId: selectedPlayer.id,
        playerDroppedId: actionType === 'add_drop' ? playerToDrop : undefined,
        faabBid: waiverType === 'faab' ? faabBid : 0,
      }

      const response = await fetch('/api/league/waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit waiver claim')
      }

      // Reset form
      setSelectedPlayer(null)
      setPlayerToDrop('')
      setFaabBid(1)
      
      // Refresh available players
      fetchAvailablePlayers()
      onTransactionSubmitted?.()
    } catch (err) {
      console.error('Error submitting waiver claim:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default:
        return null
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please sign in to view the waiver wire</p>
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Waiver Wire</CardTitle>
              <CardDescription>
                Available players for Week {weekNumber}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {waiverType === 'faab' && (
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${faabBudget} FAAB
                </Badge>
              )}
              <Badge variant="secondary">
                {filteredPlayers.length} Available
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pos</SelectItem>
                <SelectItem value="PG">PG</SelectItem>
                <SelectItem value="SG">SG</SelectItem>
                <SelectItem value="SF">SF</SelectItem>
                <SelectItem value="PF">PF</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value: string) => {
              const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder]
              setSortBy(newSortBy)
              setSortOrder(newSortOrder)
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="projectedFpts-desc">Fantasy Pts (High)</SelectItem>
                <SelectItem value="projectedFpts-asc">Fantasy Pts (Low)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="team-asc">Team (A-Z)</SelectItem>
                <SelectItem value="position-asc">Position</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Proj Pts</TableHead>
                <TableHead className="text-right">Avg Pts</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="font-medium">{player.name}</div>
                  </TableCell>
                  <TableCell>{player.team}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {player.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {player.projectedFpts?.toFixed(1) || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.averagePoints?.toFixed(1) || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {getTrendIcon(player.trend)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openClaimDialog(player)}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Claim
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Claim {selectedPlayer?.name}</DialogTitle>
                          <DialogDescription>
                            {actionType === 'add_drop' 
                              ? 'Select a player to drop and set your claim details'
                              : 'Set your claim details for this player'
                            }
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* Player to drop (if roster is full) */}
                          {actionType === 'add_drop' && (
                            <div>
                              <label className="text-sm font-medium">Player to Drop</label>
                              <Select value={playerToDrop} onValueChange={setPlayerToDrop}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select player to drop" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rosterPlayers.map((player) => (
                                    <SelectItem key={player.id} value={player.id}>
                                      {player.name} ({player.designatedPosition})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* FAAB Bid */}
                          {waiverType === 'faab' && (
                            <div>
                              <label className="text-sm font-medium">FAAB Bid</label>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  max={faabBudget}
                                  value={faabBid}
                                  onChange={(e) => setFaabBid(Number(e.target.value))}
                                />
                                <span className="text-sm text-muted-foreground">
                                  / ${faabBudget}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            onClick={submitWaiverClaim}
                            disabled={
                              isSubmitting ||
                              (actionType === 'add_drop' && !playerToDrop) ||
                              (waiverType === 'faab' && faabBid > faabBudget)
                            }
                          >
                            {isSubmitting && <Spinner className="h-4 w-4" />}
                            Submit Claim
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlayers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No available players found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
