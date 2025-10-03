import React, { useState } from 'react'
import { View, Text, TextInput, Button } from 'react-native'
import { useSyncQueue } from '../hooks/useSyncQueue'

export default function WaterReadingForm() {
  const { enqueueWaterReading } = useSyncQueue()
  const [temperature, setTemperature] = useState('')
  const [ph, setPh] = useState('')
  const [dissolvedOxygen, setDissolvedOxygen] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = async () => {
    try {
      await enqueueWaterReading({
        temperature: temperature ? parseFloat(temperature) : undefined,
        ph: ph ? parseFloat(ph) : undefined,
        dissolvedOxygen: dissolvedOxygen ? parseFloat(dissolvedOxygen) : undefined,
      })
      setMessage('Saved locally. Will sync when online.')
      setTemperature(''); setPh(''); setDissolvedOxygen('')
    } catch (e) {
      setMessage('Failed to save locally')
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Water Reading (Offline)</Text>
      <Text>Temperature (°C)</Text>
      <TextInput keyboardType="numeric" value={temperature} onChangeText={setTemperature} style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 }} />
      <Text>pH</Text>
      <TextInput keyboardType="numeric" value={ph} onChangeText={setPh} style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 }} />
      <Text>Dissolved Oxygen (mg/L)</Text>
      <TextInput keyboardType="numeric" value={dissolvedOxygen} onChangeText={setDissolvedOxygen} style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 12 }} />
      <Button title="Save Offline" onPress={onSubmit} />
      {message ? <Text style={{ marginTop: 10 }}>{message}</Text> : null}
    </View>
  )
}
