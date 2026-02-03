import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Text, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, FONTS } from '../constants/theme';
import { checkTaskStatus, TaskStatusResponse } from './services/sunoService';

export default function PlayerScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  
  const [status, setStatus] = useState<TaskStatusResponse['status']>('pending');
  const [message, setMessage] = useState<string>('Initializing...');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Poll for task status
  useEffect(() => {
    if (!taskId) {
      Alert.alert('Error', 'No task ID provided');
      router.back();
      return;
    }

    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await checkTaskStatus(taskId);
        console.log(`[Player] Task status: ${response.status}, Message: ${response.message}`);
        
        setStatus(response.status);
        if (response.message) setMessage(response.message);
        if (response.analysis_result) setAnalysisResult(response.analysis_result);

        if (response.status === 'completed' && response.music_url) {
          setMusicUrl(response.music_url);
          setIsLoading(false);
          clearInterval(intervalId);
          loadAndPlayMusic(response.music_url);
        } else if (response.status === 'failed') {
          setIsLoading(false);
          clearInterval(intervalId);
          Alert.alert('Generation Failed', response.error || 'Unknown error occurred');
        }
      } catch (error) {
        console.error('[Player] Polling error:', error);
        // Continue polling even on error, might be temporary network issue
      }
    };

    // Initial check
    pollStatus();
    
    // Poll every 3 seconds
    intervalId = setInterval(pollStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        console.log('[Player] Unloading sound');
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAndPlayMusic = async (url: string) => {
    try {
      console.log(`[Player] Loading sound from ${url}`);
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      // Listen for playback status updates
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
            // Optional: reset to beginning
            newSound.setPositionAsync(0);
          }
        }
      });
    } catch (error) {
      console.error('[Player] Failed to load sound', error);
      Alert.alert('Error', 'Failed to play music');
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const handleBack = () => {
    if (sound) {
      sound.stopAsync();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color={COLORS.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.playerContainer}>
          {isLoading || status !== 'completed' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryAccent} />
              
              <Text style={styles.loadingText}>
                {message || (status === 'pending' ? 'Waiting in queue...' : 'Processing...')}
              </Text>

              {analysisResult && (
                <View style={styles.analysisContainer}>
                  <Text style={styles.analysisTitle}>Vibe Detected:</Text>
                  <Text style={styles.analysisText}>
                    {analysisResult.title || analysisResult.style || 'Analyzing image content...'}
                  </Text>
                </View>
              )}
              
              {!analysisResult && (
                <Text style={styles.subLoadingText}>This may take up to a minute.</Text>
              )}
            </View>
          ) : (
            <>
              {/* Album Art Placeholder */}
              <View style={styles.albumArtContainer}>
                <View style={styles.albumArt}>
                  <Ionicons name="musical-notes" size={80} color={COLORS.text.muted} />
                </View>
              </View>

              {/* Track Info */}
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>Suno AI Song</Text>
                <Text style={styles.trackSubtitle}>Generated from your photo</Text>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity 
                  onPress={togglePlayback} 
                  style={styles.playButton}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={48} 
                    color="#FFF" 
                    style={{ marginLeft: isPlaying ? 0 : 4 }} // visual adjustment for play icon
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  headerTitle: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 18,
    color: COLORS.text.dark,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 20,
    fontFamily: FONTS.primary.regular,
    fontSize: 18,
    color: COLORS.text.dark,
    textAlign: 'center',
  },
  subLoadingText: {
    marginTop: 10,
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  analysisContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  analysisTitle: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 14,
    color: COLORS.primaryAccent,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  analysisText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 16,
    color: COLORS.text.light,
    textAlign: 'center',
  },
  albumArtContainer: {
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  albumArt: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 50,
  },
  trackTitle: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 24,
    color: COLORS.text.dark,
    marginBottom: 8,
  },
  trackSubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: 16,
    color: COLORS.text.muted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});
