import { Calendar, MapPin } from 'lucide-react'
import type { Event } from '@/data/events'
import clsx from 'clsx'

export default function EventCard({ event }: { event: Event }) {
  return (
    <div
      className={clsx(
        'bg-surface border rounded-lg p-7 card-hover',
        event.status === 'upcoming' ? 'border-gold/20' : 'border-white/5'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        {event.tag && (
          <span className="text-xs text-gold border border-gold/30 px-2 py-0.5 rounded-sm">
            {event.tag}
          </span>
        )}
        <span
          className={clsx(
            'text-xs px-2 py-0.5 rounded-sm ml-auto',
            event.status === 'upcoming'
              ? 'bg-gold/10 text-gold'
              : 'bg-white/5 text-muted'
          )}
        >
          {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
        </span>
      </div>

      <h3 className="font-display font-bold text-white text-xl mb-3">
        {event.title}
      </h3>
      <p className="text-muted text-sm leading-relaxed mb-5">
        {event.description}
      </p>

      <div className="flex flex-col gap-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <Calendar size={13} className="text-gold" />
          {event.date}
        </span>
        <span className="flex items-center gap-2">
          <MapPin size={13} className="text-gold" />
          {event.location}
        </span>
      </div>
    </div>
  )
}
