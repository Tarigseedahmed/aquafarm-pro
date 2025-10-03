import { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiFetch } from '../api/client'

const STORAGE_KEY = 'aquafarm.sync.queue'

type WaterReading = {
  id: string
  temperature?: number
  ph?: number
  dissolvedOxygen?: number
  recordedAt: string
}

type QueueItem = {
  type: 'waterReading'
  payload: WaterReading
}

export function useSyncQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isOnline, setIsOnline] = useState<boolean>(true)

  useEffect(() => {
    const updateOnline = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    updateOnline()
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnline)
      window.addEventListener('offline', updateOnline)
      return () => {
        window.removeEventListener('online', updateOnline)
        window.removeEventListener('offline', updateOnline)
      }
    }
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) setQueue(JSON.parse(raw))
    } catch {}
  }, [])

  const persistQueue = useCallback(async (next: QueueItem[]) => {
    setQueue(next)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const enqueue = useCallback(async (item: QueueItem) => {
    const next = [...queue, item]
    await persistQueue(next)
  }, [queue, persistQueue])

  const dequeueMany = useCallback(async (count: number) => {
    const next = queue.slice(count)
    await persistQueue(next)
  }, [queue, persistQueue])

  const enqueueSampleWaterReading = useCallback(async () => {
    const sample: WaterReading = {
      id: `${Date.now()}`,
      temperature: 26.5,
      ph: 7.2,
      dissolvedOxygen: 6.8,
      recordedAt: new Date().toISOString(),
    }
    await enqueue({ type: 'waterReading', payload: sample })
  }, [enqueue])

  const enqueueWaterReading = useCallback(async (reading: Omit<WaterReading, 'id' | 'recordedAt'> & { recordedAt?: string }) => {
    const item: WaterReading = {
      id: `${Date.now()}`,
      temperature: reading.temperature,
      ph: reading.ph,
      dissolvedOxygen: reading.dissolvedOxygen,
      recordedAt: reading.recordedAt ?? new Date().toISOString(),
    }
    await enqueue({ type: 'waterReading', payload: item })
  }, [enqueue])

  const trySync = useCallback(async () => {
    if (!isOnline || queue.length === 0) return
    // send up to 10 items in order
    const batch = queue.slice(0, Math.min(10, queue.length))
    for (const item of batch) {
      if (item.type === 'waterReading') {
        try {
          const res = await apiFetch('/mobile/water-quality/readings', {
            method: 'POST',
            body: JSON.stringify(item.payload),
          })
          if (!res.ok) {
            // stop on first error to retry later
            break
          }
        } catch {
          break
        }
      }
    }
    // remove successfully attempted items
    await dequeueMany(batch.length)
  }, [isOnline, queue, dequeueMany])

  const queueLength = useMemo(() => queue.length, [queue])

  return { queue, queueLength, isOnline, enqueue, enqueueSampleWaterReading, enqueueWaterReading, trySync }
}
