import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

export default function LoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Artificial delay to show loading animation, then navigate to player
    const timer = setTimeout(() => {
      // Forward the prompts data to the player screen
      router.replace({
        pathname: '/player',
        params: params // Pass through all params (including prompts)
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [params]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={styles.text}>Generating your melody...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'System',
  },
});

