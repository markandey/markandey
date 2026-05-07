import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '@packages/db'
import { useAuth } from '@packages/auth'
import { Button, Card } from '@packages/ui'

interface Trip {
  id: string
  name: string
  location: string
  start_date: string
  end_date: string
  created_by: string
}

export function TripList() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrips()

    const channel = supabase
      .channel('trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        loadTrips()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadTrips() {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true })
    setTrips(data || [])
    setLoading(false)
  }

  if (loading) return <div>Loading trips...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Camping Trips</h1>
        <Link to="/camping/new">
          <Button>+ New Trip</Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center">No trips yet. Create your first camping trip!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip) => (
            <Link key={trip.id} to={`/camping/${trip.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg">{trip.name}</h3>
                <p className="text-gray-500 text-sm">{trip.location}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
