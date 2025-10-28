import { LeagueDashboard } from '@/components/league'
import { Suspense } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { stackServerApp } from '@/stack/server'
import { redirect } from 'next/navigation'

interface LeaguePageProps {
  params: {
    leagueId: string
  }
  searchParams: {
    week?: string
  }
}

export default async function LeaguePage({ params, searchParams }: LeaguePageProps) {
  // Protect the page - require authentication
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect('/handler/sign-in')
  }

  const leagueId = parseInt(params.leagueId)
  const weekNumber = searchParams.week ? parseInt(searchParams.week) : 1

  if (isNaN(leagueId)) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid League</h1>
          <p className="text-muted-foreground">The league ID provided is not valid.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      }>
        <LeagueDashboard leagueId={leagueId} weekNumber={weekNumber} />
      </Suspense>
    </div>
  )
}
