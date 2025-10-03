import React from 'react'
import { SafeAreaView, Text, View, StatusBar, Button, ScrollView } from 'react-native'
import { useSyncQueue } from './src/hooks/useSyncQueue'
import WaterReadingForm from './src/screens/WaterReadingForm'

export default function App() {
  const { isOnline, queueLength, enqueueSampleWaterReading, trySync } = useSyncQueue()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>AquaFarm Mobile</Text>
        <Text>Network: {isOnline ? 'Online' : 'Offline'}</Text>
        <Text>Pending queue: {queueLength}</Text>
        <View style={{ height: 12 }} />
        <Button title="Add sample water reading (offline)" onPress={enqueueSampleWaterReading} />
        <View style={{ height: 12 }} />
        <Button title="Sync now" onPress={trySync} />

        <View style={{ height: 24 }} />
        <WaterReadingForm />
      </ScrollView>
    </SafeAreaView>
  )
}
