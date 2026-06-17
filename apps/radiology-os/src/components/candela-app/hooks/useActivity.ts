'use client';

import { useState, useEffect, useCallback } from 'react';
import { activityBus, type CandelaActivityEvent, type ActivityEventType } from '@/design-system/candela';

export function useActivity(maxEvents = 100) {
  const [events, setEvents] = useState<CandelaActivityEvent[]>([]);

  useEffect(() => {
    const unsub = activityBus.on('*', (event) => {
      setEvents(prev => [event, ...prev].slice(0, maxEvents));
    });
    return unsub;
  }, [maxEvents]);

  const emit = useCallback(
    (type: ActivityEventType, data: Omit<CandelaActivityEvent, 'id' | 'type' | 'timestamp'>) => {
      activityBus.emit({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        timestamp: new Date(),
        ...data,
      } as CandelaActivityEvent);
    },
    [],
  );

  return { events, emit };
}
