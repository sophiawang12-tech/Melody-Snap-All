import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert, Animated, Dimensions, Image, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS } from '../constants/theme';
import { checkTaskStatus, generateSongTask, TaskStatusResponse } from './services/sunoService';
import ShareCardModal from './components/ShareCardModal';
import { generateShareUrl } from './services/shareService';

const { width, height } = Dimensions.get('window');

// ============================================
// Animated Blob Component
// ============================================
interface BlobProps {
  color: string;
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  delay?: number;
}

const Blob = ({ color, size, top, left, right, bottom, delay = 0 }: BlobProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 8000 + Math.random() * 4000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 8000 + Math.random() * 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.6,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
};

// ============================================
// Waveform Loader Animation Component
// ============================================

interface WaveBarProps {
  color: string;
  delay: number;
  minHeight: number;
  maxHeight: number;
}

const WaveBar = ({ color, delay, minHeight, maxHeight }: WaveBarProps) => {
  const animatedHeight = useRef(new Animated.Value(minHeight)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedHeight, {
            toValue: maxHeight,
            duration: 400 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(animatedHeight, {
            toValue: minHeight,
            duration: 400 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        width: 6,
        height: animatedHeight,
        backgroundColor: color,
        borderRadius: 3,
        marginHorizontal: 3,
      }}
    />
  );
};

const WaveformLoader = () => {
  // Matches design colors: Accent, Highlight, Neon
  const bars: WaveBarProps[] = [
    { color: 'rgba(255, 183, 178, 0.4)', delay: 100, minHeight: 16, maxHeight: 32 },
    { color: 'rgba(255, 183, 178, 0.6)', delay: 300, minHeight: 24, maxHeight: 48 },
    { color: '#FFB7B2', delay: 0, minHeight: 40, maxHeight: 60 }, // Center
    { color: '#FF8E8E', delay: 200, minHeight: 32, maxHeight: 50 }, // Neon
    { color: '#FFB7B2', delay: 400, minHeight: 40, maxHeight: 60 },
    { color: 'rgba(255, 183, 178, 0.6)', delay: 100, minHeight: 24, maxHeight: 48 },
    { color: 'rgba(255, 183, 178, 0.4)', delay: 300, minHeight: 16, maxHeight: 32 },
  ];

  return (
    <View style={waveformStyles.container}>
      {bars.map((bar, index) => (
        <WaveBar
          key={index}
          color={bar.color}
          delay={bar.delay}
          minHeight={bar.minHeight}
          maxHeight={bar.maxHeight}
        />
      ))}
    </View>
  );
};

const waveformStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 48,
    marginBottom: 6,
  },
});

// ============================================
// Progress Mapping (message → percentage)
// ============================================

const STAGE_PROGRESS: Record<string, number> = {
  'Initializing...': 2,
  'Uploading...': 8,
  'Analyzing...': 15,
  'Analyzing your photo...': 22,
  'Vibe detected! Composing melody...': 42,
  'AI Band is performing...': 65,
  'Composition complete!': 100,
};

const STATUS_PROGRESS: Record<string, number> = {
  pending: 5,
  processing: 35,
  completed: 100,
  failed: 0,
};

// ============================================
// GlowRing - Animated SVG Circular Progress
// ============================================

const RING_SIZE = 240;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface GlowRingProps {
  progress: number; // 0-100
  imageUri?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GlowRing = ({ progress, imageUri }: GlowRingProps) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const photoSize = RING_SIZE - 56;

  // Continuous rotation
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Glow pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Smooth progress animation
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [RING_CIRCUMFERENCE, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={glowRingStyles.container}>
      {/* Outer glow layer */}
      <Animated.View
        style={[
          glowRingStyles.glowOuter,
          { opacity: pulseAnim },
        ]}
      />

      {/* Rotating ring */}
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.primaryAccent} stopOpacity="1" />
              <Stop offset="50%" stopColor="#FF8E8E" stopOpacity="0.9" />
              <Stop offset="100%" stopColor={COLORS.primaryAccent} stopOpacity="0.15" />
            </SvgLinearGradient>
          </Defs>
          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="rgba(255, 183, 178, 0.12)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {/* Progress arc */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="url(#ringGradient)"
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
          />
        </Svg>
      </Animated.View>

      {/* Center: User photo */}
      {imageUri && (
        <View style={[glowRingStyles.photoWrapper, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}>
          <Image
            source={{ uri: imageUri }}
            style={glowRingStyles.photo}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(255, 183, 178, 0.2)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
    </View>
  );
};

const glowRingStyles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    backgroundColor: 'transparent',
    shadowColor: COLORS.primaryAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
    // Use a border trick to generate glow on iOS
    borderWidth: 2,
    borderColor: 'rgba(255, 183, 178, 0.08)',
  },
  photoWrapper: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#F0EDE5',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});

// ============================================
// Main Player Screen Component
// ============================================

export default function PlayerScreen() {
  const router = useRouter();
  const { taskId: urlTaskId, imageUri } = useLocalSearchParams<{ taskId?: string; imageUri?: string }>();
  
  const [taskId, setTaskId] = useState<string | null>(urlTaskId || null);
  const [status, setStatus] = useState<TaskStatusResponse['status']>('pending');
  const [message, setMessage] = useState<string>('Initializing...');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // Animated progress bar (bypasses React re-renders for smooth updates)
  const playbackProgress = useRef(new Animated.Value(0)).current;

  // Progress tracking
  const [displayProgress, setDisplayProgress] = useState(0);
  const crawlRef = useRef<NodeJS.Timeout | null>(null);

  // Map message/status to target progress and add slow crawl between stages
  useEffect(() => {
    const targetFromMessage = STAGE_PROGRESS[message];
    const targetFromStatus = STATUS_PROGRESS[status];
    const target = targetFromMessage ?? targetFromStatus ?? 5;

    // Jump to the target immediately (animated inside GlowRing)
    setDisplayProgress(target);

    // Clear any previous crawl interval
    if (crawlRef.current) clearInterval(crawlRef.current);

    // If not yet complete, slowly crawl between stages so progress doesn't feel stuck
    if (target < 100) {
      // Determine the next stage ceiling so crawl never overshoots
      const sortedStages = Object.values(STAGE_PROGRESS).sort((a, b) => a - b);
      const nextCeiling = sortedStages.find((v) => v > target) ?? 100;
      const maxCrawl = nextCeiling - 2; // leave gap before next stage jump

      crawlRef.current = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= maxCrawl) return prev;
          return prev + 0.5;
        });
      }, 2000);
    }

    return () => {
      if (crawlRef.current) clearInterval(crawlRef.current);
    };
  }, [message, status]);

  // Initialize: upload image if needed, then poll for task status
  useEffect(() => {
    // Check if we have either taskId or imageUri
    if (!taskId && !imageUri) {
      Alert.alert('Error', 'No task ID or image provided');
      router.back();
      return;
    }

    // If no taskId, we need to upload first
    if (!taskId && imageUri) {
      uploadImageAndGetTaskId();
      return;
    }

    // If we have taskId, start polling
    if (!taskId) return;

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
      } catch (error: any) {
        console.error('[Player] Polling error:', error);
        // If task not found (404), the backend likely restarted and lost in-memory tasks
        if (error?.message?.includes('404')) {
          clearInterval(intervalId);
          setIsLoading(false);
          Alert.alert(
            'Task Expired',
            'The server was restarted and this task no longer exists. Please go back and try again.',
            [{ text: 'Go Back', onPress: () => router.back() }]
          );
        }
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId]);

  useEffect(() => {
    return () => {
      if (sound) {
        console.log('[Player] Unloading sound');
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const uploadImageAndGetTaskId = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image provided');
      router.back();
      return;
    }

    try {
      setMessage('Initializing...');
      console.log('[Player] Starting image upload process');

      // Compress image
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri as string,
        [{ resize: { width: 512 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log(`[Player] Compressed image size: ${manipResult.width}x${manipResult.height}`);

      // Upload to backend
      setMessage('Uploading...');
      const newTaskId = await generateSongTask(manipResult.uri);
      
      console.log(`[Player] Received task ID: ${newTaskId}`);
      setTaskId(newTaskId);
      setMessage('Analyzing...');
    } catch (error) {
      console.error('[Player] Upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      router.back();
    }
  };

  const loadAndPlayMusic = async (url: string) => {
    try {
      console.log(`[Player] Loading sound from ${url}`);
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 200 }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded) {
          setIsPlaying(playbackStatus.isPlaying);
          const pos = playbackStatus.positionMillis ?? 0;
          const dur = playbackStatus.durationMillis ?? 0;
          setPositionMillis(pos);
          if (dur) {
            setDurationMillis(dur);
            // Drive animated progress bar directly (no re-render needed)
            const pct = dur > 0 ? (pos / dur) * 100 : 0;
            Animated.timing(playbackProgress, {
              toValue: pct,
              duration: 180, // smooth interpolation between updates
              useNativeDriver: false,
            }).start();
          }
          if (playbackStatus.didJustFinish) {
            // Loop: reset to beginning and replay
            playbackProgress.setValue(0);
            newSound.setPositionAsync(0);
            newSound.playAsync();
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

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isCompleted = !isLoading && status === 'completed';

  const handleBack = () => {
    if (sound) {
      sound.stopAsync();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isCompleted ? "light" : "dark"} />
      
      {/* Background: Full-screen photo when completed, gradient + blobs otherwise */}
      <View style={StyleSheet.absoluteFill}>
        {isCompleted && imageUri ? (
          <>
            <Image
              source={{ uri: imageUri as string }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <>
            <LinearGradient
              colors={['#FDFCF8', '#E8EFE8']}
              style={StyleSheet.absoluteFill}
            />
            {/* Animated Blobs */}
            <Blob color="rgba(255, 183, 178, 0.2)" size={width * 0.8} top={-width * 0.4} left={-width * 0.2} />
            <Blob color="rgba(232, 239, 232, 0.4)" size={width * 0.8} bottom={-width * 0.4} right={-width * 0.2} delay={2000} />
            <Blob color="rgba(239, 237, 244, 0.4)" size={width * 0.6} top={height * 0.3} right={-width * 0.1} delay={4000} />
          </>
        )}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
             <BlurView intensity={20} tint={isCompleted ? "dark" : "light"} style={styles.blurButton}>
                <Ionicons name="chevron-back" size={24} color={isCompleted ? '#FFF' : COLORS.text.dark} />
             </BlurView>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isCompleted && { color: '#FFF' }]}>
            {isCompleted ? 'NOW PLAYING' : 'Creating'}
          </Text>
          
          {/* Share button - only show when completed */}
          {isCompleted && musicUrl && taskId ? (
            <TouchableOpacity 
              onPress={async () => {
                // Pause player audio so share modal can play its own
                if (sound && isPlaying) await sound.pauseAsync();
                setShowShareModal(true);
              }} 
              style={styles.backButton}
            >
              <BlurView intensity={20} tint="dark" style={styles.blurButton}>
                <Ionicons name="share-outline" size={24} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <View style={styles.contentContainer}>
          {isLoading || status !== 'completed' ? (
            <View style={styles.loadingCenterWrapper}>
              {/* GlowRing with user photo */}
              <GlowRing
                progress={displayProgress}
                imageUri={imageUri as string | undefined}
              />

              {/* Progress percentage + status message */}
              <Text style={styles.progressPercent}>
                {Math.round(displayProgress)}%{' '}
                <Text style={styles.progressMessage}>
                  {message || (status === 'pending' ? 'Generating...' : 'Processing...')}
                </Text>
              </Text>

              {/* Vibe detected card */}
              {analysisResult && (
                <BlurView intensity={20} tint="light" style={styles.vibeCard}>
                  <Text style={styles.analysisLabel}>VIBE DETECTED</Text>
                  <Text style={styles.analysisText}>
                    {analysisResult.title || analysisResult.style || 'Analyzing...'}
                  </Text>
                  
                  {analysisResult.tags && analysisResult.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {analysisResult.tags.map((tag: string, index: number) => (
                        <View key={index} style={styles.tagBadge}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </BlurView>
              )}
            </View>
          ) : (
            <>
              {/* Track Info */}
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: '#FFF' }]}>
                  {analysisResult?.title || 'Suno AI Song'}
                </Text>
                <View style={styles.trackSubtitleRow}>
                  <Ionicons name="sparkles" size={16} color={COLORS.primaryAccent} />
                  <Text style={[styles.trackSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>Generated from your snap</Text>
                </View>
              </View>

              {/* Controls */}
              <View style={styles.controlsSection}>
                {/* Waveform Visualizer */}
                <WaveformLoader />

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <Animated.View
                      style={{
                        width: playbackProgress.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: COLORS.primaryAccent,
                      }}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={[styles.timeText, { color: 'rgba(255,255,255,0.7)' }]}>{formatTime(positionMillis)}</Text>
                    <Text style={[styles.timeText, { color: 'rgba(255,255,255,0.7)' }]}>{formatTime(durationMillis)}</Text>
                  </View>
                </View>

                {/* Play Buttons */}
                <View style={styles.playControls}>
                  <TouchableOpacity>
                    <Ionicons name="play-skip-back" size={28} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={togglePlayback}
                    activeOpacity={0.8}
                    style={styles.playButtonWrapper}
                  >
                    <LinearGradient
                      colors={[COLORS.primaryAccent, '#FF8E8E']}
                      style={styles.playButtonGradient}
                    >
                      <Ionicons 
                        name={isPlaying ? "pause" : "play"} 
                        size={40} 
                        color="white" 
                        style={{ marginLeft: isPlaying ? 0 : 4 }}
                      />
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Ionicons name="play-skip-forward" size={28} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
      
      {/* Share Modal */}
      {imageUri && taskId && (
        <ShareCardModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUri={imageUri as string}
          shareUrl={generateShareUrl(taskId)}
          musicUrl={musicUrl || undefined}
          trackTitle={analysisResult?.title || 'Melody Snap Song'}
          trackSubtitle={analysisResult?.style || 'Generated from your snap'}
          tags={analysisResult?.tags || []}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCF8',
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
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 16,
    color: COLORS.text.dark,
    letterSpacing: 1,
  },
  backButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  blurButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingCenterWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  progressPercent: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 28,
    color: COLORS.text.dark,
    textAlign: 'center',
  },
  progressMessage: {
    fontFamily: FONTS.primary.regular,
    fontSize: 16,
    color: COLORS.text.muted,
  },
  vibeCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  analysisLabel: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 12,
    color: COLORS.primaryAccent,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  analysisText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 16,
    color: COLORS.text.dark,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 183, 178, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 178, 0.3)',
  },
  tagText: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 11,
    color: COLORS.primaryAccent,
    letterSpacing: 0.5,
  },


  // Track Info
  trackInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  trackTitle: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 24,
    color: COLORS.text.dark,
    marginBottom: 4,
    textAlign: 'center',
  },
  trackSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackSubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: 16,
    color: COLORS.text.muted,
  },

  // Controls
  controlsSection: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.primary.semiBold,
    color: COLORS.text.muted,
  },
  playControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  playButtonWrapper: {
    shadowColor: '#FFB7B2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  playButtonGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
