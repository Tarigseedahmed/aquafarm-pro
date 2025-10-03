/**
 * AquaFarm Pro - Real-time Updates Hook
 * SSE-based real-time data updates for IoT and water quality
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'react-hot-toast'

interface RealtimeUpdate {
  type: 'water_quality' | 'farm_status' | 'pond_alert' | 'iot_sensor'
  data: any
  timestamp: string
  farmId?: string
  pondId?: string
}

interface UseRealtimeUpdatesOptions {
  enabled?: boolean
  farmId?: string
  pondId?: string
  onUpdate?: (update: RealtimeUpdate) => void
  onError?: (error: Error) => void
}

export function useRealtimeUpdates({
  enabled = true,
  farmId,
  pondId,
  onUpdate,
  onError
}: UseRealtimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const queryClient = useQueryClient()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return

    setConnectionStatus('connecting')
    
    try {
      // Build SSE endpoint with filters
      const params = new URLSearchParams()
      if (farmId) params.append('farmId', farmId)
      if (pondId) params.append('pondId', pondId)
      
      const url = `/api/notifications/stream?${params.toString()}`
      const eventSource = new EventSource(url)
      
      eventSource.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        setLastUpdate(new Date())
        console.log('SSE connection established')
      }

      eventSource.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data)
          setLastUpdate(new Date())
          
          // Handle different update types
          handleUpdate(update)
          
          // Call custom update handler
          onUpdate?.(update)
          
        } catch (error) {
          console.error('Error parsing SSE message:', error)
          onError?.(error as Error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setConnectionStatus('error')
        setIsConnected(false)
        onError?.(new Error('SSE connection failed'))
        
        // Attempt to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) {
            connect()
          }
        }, 5000)
      }

      eventSourceRef.current = eventSource
      
    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      setConnectionStatus('error')
      onError?.(error as Error)
    }
  }, [enabled, farmId, pondId, onUpdate, onError])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  const handleUpdate = useCallback((update: RealtimeUpdate) => {
    // Invalidate relevant queries based on update type
    switch (update.type) {
      case 'water_quality':
        if (update.farmId) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.waterQuality.detail(update.farmId) 
          })
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.waterQuality.readings(update.farmId) 
          })
        }
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.waterQuality.lists() 
        })
        break
        
      case 'farm_status':
        if (update.farmId) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.farms.detail(update.farmId) 
          })
        }
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.farms.lists() 
        })
        break
        
      case 'pond_alert':
        if (update.farmId) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.farms.detail(update.farmId) 
          })
        }
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.ponds.lists() 
        })
        break
        
      case 'iot_sensor':
        // Handle IoT sensor updates
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.analytics.dashboard() 
        })
        break
    }
    
    // Show toast notification for important updates
    if (update.type === 'pond_alert' || update.type === 'iot_sensor') {
      toast.success(`تحديث جديد: ${getUpdateMessage(update)}`)
    }
  }, [queryClient])

  const getUpdateMessage = (update: RealtimeUpdate): string => {
    switch (update.type) {
      case 'water_quality':
        return 'تحديث جودة المياه'
      case 'farm_status':
        return 'تحديث حالة المزرعة'
      case 'pond_alert':
        return 'تنبيه من الحوض'
      case 'iot_sensor':
        return 'قراءة جديدة من المستشعر'
      default:
        return 'تحديث جديد'
    }
  }

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }
    
    return () => {
      disconnect()
    }
  }, [enabled, farmId, pondId, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    connectionStatus,
    lastUpdate,
    connect,
    disconnect,
    reconnect: connect
  }
}

// Hook for water quality real-time updates
export function useWaterQualityRealtime(farmId?: string) {
  return useRealtimeUpdates({
    enabled: !!farmId,
    farmId,
    onUpdate: (update) => {
      if (update.type === 'water_quality') {
        console.log('Water quality update received:', update.data)
      }
    }
  })
}

// Hook for farm status real-time updates
export function useFarmStatusRealtime(farmId?: string) {
  return useRealtimeUpdates({
    enabled: !!farmId,
    farmId,
    onUpdate: (update) => {
      if (update.type === 'farm_status') {
        console.log('Farm status update received:', update.data)
      }
    }
  })
}

// Hook for IoT sensor updates
export function useIoTSensorRealtime() {
  return useRealtimeUpdates({
    enabled: true,
    onUpdate: (update) => {
      if (update.type === 'iot_sensor') {
        console.log('IoT sensor update received:', update.data)
      }
    }
  })
}
