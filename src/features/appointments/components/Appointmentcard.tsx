'use client';

import { formatTime, cn } from '@/lib/utils';
import { StatusBadge }    from './StatusBadge';
import type { Appointment } from '@/lib/api/appointments';
import { Phone, AlertCircle } from 'lucide-react';

interface Props {
  appointment: Appointment;
  onClick?:   () => void;
  compact?:   boolean;
}

export function AppointmentCard({ appointment, onClick, compact }: Props) {
  const { client, doctor, status, appointmentServices, startTime, endTime } = appointment;
  const primary = appointmentServices?.[0];
  const serviceColor = (primary?.service as any)?.color ?? '#C8A96E';
  const services = appointmentServices.map((s) =>
    s.variant ? `${s.service.name} — ${s.variant.name}` : s.service.name
  );

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card rounded-xl border border-border transition-all duration-150',
        'hover:shadow-md hover:border-primary/30',
        onClick && 'cursor-pointer',
        compact ? 'p-3' : 'p-4',
      )}
    >
      {/* Left color strip */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: serviceColor }}
      />
      <div className={cn('pl-3', compact ? '' : 'pl-4')}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">
                {client.fullName}
              </span>
              {client.noShowCount > 1 && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  {client.noShowCount} no-shows
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(startTime)} — {formatTime(endTime)}
            </p>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {/* Services */}
        <div className="space-y-0.5 mb-2">
          {services.slice(0, compact ? 1 : 3).map((s, i) => (
            <p key={i} className="text-xs text-muted-foreground truncate">
              {s}
            </p>
          ))}
          {services.length > (compact ? 1 : 3) && (
            <p className="text-xs text-muted-foreground">
              +{services.length - (compact ? 1 : 3)} more
            </p>
          )}
        </div>

        {/* Footer */}
        {!compact && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Dr. {doctor.fullName.split(' ').slice(-1)[0]}
            </span>
            <a
              href={`tel:${client.phoneNumber}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="w-3 h-3" />
              {client.phoneNumber}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}