import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@packages/db'
import { useAuth } from '@packages/auth'
import { Button, Input, Card } from '@packages/ui'

export function NewTrip() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const { data, error } = await supabase.from('trips').insert({
      name: form.get('name'),
      location: form.get('location'),
      start_date: form.get('start_date'),
      end_date: form.get('end_date'),
      created_by: user!.id,
    }).select().single()

    if (!error && data) {
      navigate(`/camping/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Camping Trip</h1>
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Trip Name" name="name" placeholder="Summer camping at Yosemite" required />
          <Input label="Location" name="location" placeholder="Yosemite National Park" required />
          <Input label="Start Date" name="start_date" type="date" required />
          <Input label="End Date" name="end_date" type="date" required />
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Trip'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
