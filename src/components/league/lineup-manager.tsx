'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@stackframe/stack'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Lock, Unlock, AlertCircle, CheckCircle } from 'lucide-react'

interface Player {
  id: string
  name: string
  team: string
  position: string
  fantasyPoints?: number
  projectedFpts?: number
}

interface LineupSlot {
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'G' | 'F' | 'UTIL1' | 'UTIL2'
  player: Player | null
  required: boolean
}

interface LineupManagerProps {
  leagueId: number
  teamId: number
  matchupId: number
  weekNumber: number
  initialLineup?: any
  rosterPlayers: Player[]
  onLineupChange?: (lineup: any) => void
}

export function LineupManager({
  leagueId,
  teamId,
  matchupId,
  weekNumber,
  initialLineup,
  rosterPlayers,
  onLineupChange,
}: LineupManagerProps) {
  const user = useUser()
  const [lineup, setLineup] = useState<LineupSlot[]>([
    { position: 'PG', player: null, required: true },
    { position: 'SG', player: null, required: true },
    { position: 'SF', player: null, required: true },
    { position: 'PF', player: null, required: true },
    { position: 'C', player: null, required: true },
    { position: 'G', player: null, required: true },
    { position: 'F', player: null, required: true },
    { position: 'UTIL1', player: null, required: true },
    { position: 'UTIL2', player: null, required: true },
  ])
  const [benchPlayers, setBenchPlayers] = useState<Player[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [lineupId, setLineupId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load initial lineup
  useEffect(() => {
    if (initialLineup) {
      setIsLocked(initialLineup.isLocked || false)
      setLineupId(initialLineup.id)
      
      // Map initial lineup to slots
      const updatedLineup = lineup.map(slot => {
        const playerKey = slot.position.toLowerCase() + 'PlayerId'
        const playerId = initialLineup[playerKey]
        const player = rosterPlayers.find(p => p.id === playerId)
        return { ...slot, player: player || null }
      })
      
      setLineup(updatedLineup)
      
      // Set bench players
      const benchIds = initialLineup.benchPlayerIds || []
      const bench = benchIds.map((id: string) => 
        rosterPlayers.find((p: Player) => p.id === id)
      ).filter(Boolean)
      setBenchPlayers(bench)
    }
  }, [initialLineup, rosterPlayers])

  const getAvailablePlayers = () => {
    const usedPlayerIds = new Set([
      ...lineup.map(slot => slot.player?.id).filter(Boolean),
      ...benchPlayers.map(p => p.id)
    ])
    return rosterPlayers.filter(player => !usedPlayerIds.has(player.id))
  }

  const canPlayerFillSlot = (player: Player, position: string) => {
    const playerPositions = player.position.split(',').map(p => p.trim())
    
    switch (position) {
      case 'PG':
        return playerPositions.includes('PG')
      case 'SG':
        return playerPositions.includes('SG')
      case 'SF':
        return playerPositions.includes('SF')
      case 'PF':
        return playerPositions.includes('PF')
      case 'C':
        return playerPositions.includes('C')
      case 'G':
        return playerPositions.some(p => ['PG', 'SG'].includes(p))
      case 'F':
        return playerPositions.some(p => ['SF', 'PF'].includes(p))
      case 'UTIL1':
      case 'UTIL2':
        return true
      default:
        return false
    }
  }

  const setPlayerInSlot = (slotIndex: number, player: Player | null) => {
    if (isLocked) return
    
    const newLineup = [...lineup]
    const oldPlayer = newLineup[slotIndex].player
    
    // Remove old player back to available
    if (oldPlayer) {
      // Don't need to do anything as getAvailablePlayers will handle it
    }
    
    newLineup[slotIndex] = { ...newLineup[slotIndex], player }
    setLineup(newLineup)
    onLineupChange?.(newLineup)
  }

  const addToBench = (player: Player) => {
    if (isLocked) return
    setBenchPlayers(prev => [...prev, player])
  }

  const removeFromBench = (playerId: string) => {
    if (isLocked) return
    setBenchPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  const isLineupValid = () => {
    return lineup.every(slot => slot.required ? slot.player !== null : true)
  }

  const saveLineup = async () => {
    if (!user || isSaving) return
    
    setIsSaving(true)
    try {
      const lineupData = {
        matchupId,
        teamId,
        weekNumber,
        pgPlayerId: lineup.find(s => s.position === 'PG')?.player?.id,
        sgPlayerId: lineup.find(s => s.position === 'SG')?.player?.id,
        sfPlayerId: lineup.find(s => s.position === 'SF')?.player?.id,
        pfPlayerId: lineup.find(s => s.position === 'PF')?.player?.id,
        cPlayerId: lineup.find(s => s.position === 'C')?.player?.id,
        gPlayerId: lineup.find(s => s.position === 'G')?.player?.id,
        fPlayerId: lineup.find(s => s.position === 'F')?.player?.id,
        util1PlayerId: lineup.find(s => s.position === 'UTIL1')?.player?.id,
        util2PlayerId: lineup.find(s => s.position === 'UTIL2')?.player?.id,
        benchPlayerIds: benchPlayers.map(p => p.id),
      }

      const response = await fetch('/api/league/lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lineupData),
      })

      if (response.ok) {
        const saved = await response.json()
        setLineupId(saved.id)
      }
    } catch (error) {
      console.error('Error saving lineup:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const lockLineup = async () => {
    if (!user || !lineupId || isLoading) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/league/lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lock',
          lineupId,
        }),
      })

      if (response.ok) {
        setIsLocked(true)
      }
    } catch (error) {
      console.error('Error locking lineup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please sign in to manage your lineup</p>
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
              <CardTitle className="flex items-center gap-2">
                Week {weekNumber} Lineup
                {isLocked ? (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Unlock className="h-3 w-3" />
                    Unlocked
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Set your starting lineup and bench players
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isLocked && (
                <>
                  <Button
                    onClick={saveLineup}
                    disabled={isSaving || !isLineupValid()}
                    variant="outline"
                  >
                    {isSaving && <Spinner className="h-4 w-4" />}
                    Save
                  </Button>
                  <Button
                    onClick={lockLineup}
                    disabled={!lineupId || isLoading || !isLineupValid()}
                    className="gap-2"
                  >
                    {isLoading && <Spinner className="h-4 w-4" />}
                    <Lock className="h-4 w-4" />
                    Lock Lineup
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Starting Lineup */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Starting Lineup
                {isLineupValid() ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lineup.map((slot, index) => (
                  <div
                    key={slot.position}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 min-h-[100px] transition-colors",
                      slot.player
                        ? "border-solid border-green-500 bg-green-50 dark:bg-green-950"
                        : slot.required
                        ? "border-orange-300 bg-orange-50 dark:bg-orange-950"
                        : "border-gray-300 bg-gray-50 dark:bg-gray-950",
                      isLocked && "opacity-60"
                    )}
                  >
                    <div className="text-sm font-medium text-center mb-2">
                      {slot.position}
                      {slot.required && (
                        <span className="text-orange-500 ml-1">*</span>
                      )}
                    </div>
                    
                    {slot.player ? (
                      <div className="text-center">
                        <div className="font-medium">{slot.player.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot.player.team} - {slot.player.position}
                        </div>
                        {slot.player.projectedFpts && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {slot.player.projectedFpts} pts
                          </div>
                        )}
                        {!isLocked && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 text-xs"
                            onClick={() => setPlayerInSlot(index, null)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground text-sm">
                        Click a player to add
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Players & Bench */}
        <div className="space-y-6">
          {/* Available Players */}
          <Card>
            <CardHeader>
              <CardTitle>Available Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getAvailablePlayers().map(player => (
                  <div
                    key={player.id}
                    className={cn(
                      "p-2 border rounded cursor-pointer hover:bg-accent transition-colors",
                      isLocked && "cursor-not-allowed opacity-60"
                    )}
                    onClick={() => {
                      if (isLocked) return
                      // Find first empty slot that this player can fill
                      const availableSlotIndex = lineup.findIndex(slot => 
                        !slot.player && canPlayerFillSlot(player, slot.position)
                      )
                      if (availableSlotIndex !== -1) {
                        setPlayerInSlot(availableSlotIndex, player)
                      } else {
                        // Add to bench if no slots available
                        addToBench(player)
                      }
                    }}
                  >
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.team} - {player.position}
                      {player.projectedFpts && (
                        <span className="ml-2 text-green-600 dark:text-green-400">
                          {player.projectedFpts} pts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {getAvailablePlayers().length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    All players are in your lineup or on bench
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bench */}
          <Card>
            <CardHeader>
              <CardTitle>Bench ({benchPlayers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {benchPlayers.map(player => (
                  <div
                    key={player.id}
                    className={cn(
                      "p-2 border rounded flex items-center justify-between",
                      isLocked && "opacity-60"
                    )}
                  >
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.team} - {player.position}
                      </div>
                    </div>
                    {!isLocked && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromBench(player.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                {benchPlayers.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No bench players
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
