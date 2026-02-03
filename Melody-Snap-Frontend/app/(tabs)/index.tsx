import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  // Animation Values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Retro Pulse Animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500, // Slower, more breathing-like
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  }, [pulseAnim]);

  const handleCapture = () => {
    router.push('/capture');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        {/* Location & Weather (Handwritten Vibe) */}
        <View style={styles.weatherContainer}>
          <View style={styles.weatherIconBg}>
             <Ionicons name="rainy-outline" size={20} color={COLORS.text.muted} />
          </View>
          <View>
             <Text style={styles.locationText}>New York</Text>
             <Text style={styles.weatherText}>Rainy Vibes</Text>
          </View>
        </View>

        {/* Notification Bell */}
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text.dark} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>SNAP MUSIC</Text>
        <Text style={styles.subtitle}>Turn your reality into a unique sound</Text>

        {/* Retro Pulse Button */}
        <View style={styles.pulseContainer}>
          {/* Outer Pulse */}
          <Animated.View 
            style={[
              styles.pulseCircle, 
              { 
                transform: [{ scale: pulseAnim }],
                opacity: 0.3,
                backgroundColor: COLORS.primaryAccent
              }
            ]} 
          />
          {/* Inner Pulse */}
          <Animated.View 
            style={[
              styles.pulseCircle, 
              { 
                transform: [{ scale: Animated.multiply(pulseAnim, 0.95) }],
                opacity: 0.5,
                backgroundColor: COLORS.primaryAccent,
                position: 'absolute'
              }
            ]} 
          />
          
          <TouchableOpacity 
            style={styles.mainButton} 
            activeOpacity={0.9}
            onPress={handleCapture}
          >
            <Ionicons name="camera" size={56} color={COLORS.text.dark} />
            <Text style={styles.buttonLabel}>CAPTURE</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    height: 80,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 14,
    color: COLORS.text.dark,
  },
  weatherText: {
    fontFamily: FONTS.accent.regular,
    fontSize: 24,
    color: COLORS.text.muted,
    lineHeight: 28,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryAccent,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 42,
    color: COLORS.text.dark,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 60,
  },
  pulseContainer: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  mainButton: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.pulse,
    // Android elevation handled in theme
  },
  buttonLabel: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 16,
    color: COLORS.text.dark,
    marginTop: 8,
    letterSpacing: 1,
  },
});
