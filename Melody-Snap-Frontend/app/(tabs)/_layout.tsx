import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface, // Glass-like
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          elevation: 0, // Remove default Android shadow
          // ...SHADOWS.soft contains elevation, so we merge carefully if needed
          shadowColor: SHADOWS.soft.shadowColor,
          shadowOffset: SHADOWS.soft.shadowOffset,
          shadowOpacity: SHADOWS.soft.shadowOpacity,
          shadowRadius: SHADOWS.soft.shadowRadius,
        },
        tabBarActiveTintColor: COLORS.text.dark,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={26} color={color} />
          ),
          href: null, 
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push('/capture');
          },
        })}
      />
      <Tabs.Screen
        name="play"
        options={{
            href: null, 
            tabBarIcon: ({ color }) => (
                <View style={styles.playButton}>
                    <Ionicons name="play" size={28} color={COLORS.text.dark} />
                </View>
            ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            console.log("Play button pressed");
          },
        })}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primaryAccent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 36, // Move it up to float
        ...SHADOWS.pulse,
        borderWidth: 4,
        borderColor: COLORS.background, // Create "cutout" effect
    }
});
