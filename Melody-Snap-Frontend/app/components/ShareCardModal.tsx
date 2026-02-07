import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import ViewShot from 'react-native-view-shot';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, FONTS } from '../../constants/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.128.10.236:8000';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Audio Visualizer Bar
// ============================================
interface VisualizerBarProps {
  index: number;
  color: string;
  maxHeight: number;
  minHeight: number;
}

const VisualizerBar = ({ index, color, maxHeight, minHeight }: VisualizerBarProps) => {
  const animVal = useRef(new Animated.Value(minHeight)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animVal, {
            toValue: maxHeight,
            duration: 300 + Math.random() * 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animVal, {
            toValue: minHeight,
            duration: 300 + Math.random() * 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    };
    const timeout = setTimeout(animate, index * 80);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        width: 4,
        height: animVal,
        backgroundColor: color,
        borderRadius: 2,
        marginHorizontal: 2,
      }}
    />
  );
};

// ============================================
// Audio Visualizer Component
// ============================================
const AudioVisualizer = () => {
  const barCount = 20;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const center = barCount / 2;
    const dist = Math.abs(i - center) / center;
    const maxH = 36 * (1 - dist * 0.6);
    const minH = 6 + Math.random() * 4;
    const opacity = 1 - dist * 0.4;
    return {
      maxHeight: maxH,
      minHeight: minH,
      color: `rgba(255, 183, 178, ${opacity})`,
    };
  });

  return (
    <View style={visualizerStyles.container}>
      {bars.map((bar, i) => (
        <VisualizerBar
          key={i}
          index={i}
          color={bar.color}
          maxHeight={bar.maxHeight}
          minHeight={bar.minHeight}
        />
      ))}
    </View>
  );
};

const visualizerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
});

// ============================================
// Floating Particle
// ============================================
interface ParticleProps {
  delay: number;
  startX: number;
  size: number;
}

const Particle = ({ delay, startX, size }: ParticleProps) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_HEIGHT * 0.7 + Math.random() * 100);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT * 0.15 + Math.random() * 200,
          duration: 6000 + Math.random() * 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.delay(2000 + Math.random() * 2000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };
    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.primaryAccent,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
};

// ============================================
// ShareCardModal Props
// ============================================
interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
  shareUrl: string;
  musicUrl?: string;
  trackTitle?: string;
  trackSubtitle?: string;
  tags?: string[];
}

// ============================================
// Main ShareCardModal Component
// ============================================
export default function ShareCardModal({
  visible,
  onClose,
  imageUri,
  shareUrl,
  musicUrl,
  trackTitle = 'Melody Snap Song',
  trackSubtitle = 'Generated from your snap',
  tags = [],
}: ShareCardModalProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'card' | 'video' | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Ken Burns animation for the photo
  const kenBurnsScale = useRef(new Animated.Value(1)).current;
  const kenBurnsTranslateX = useRef(new Animated.Value(0)).current;
  const kenBurnsTranslateY = useRef(new Animated.Value(0)).current;

  // Card float animation
  const cardFloat = useRef(new Animated.Value(0)).current;

  // Start audio playback when modal opens
  useEffect(() => {
    if (visible && musicUrl) {
      playAudio();
    }
    return () => {
      stopAudio();
    };
  }, [visible, musicUrl]);

  // Ken Burns slow zoom + pan
  useEffect(() => {
    if (!visible) return;

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(kenBurnsScale, {
            toValue: 1.15,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(kenBurnsTranslateX, {
            toValue: 8,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(kenBurnsTranslateY, {
            toValue: -5,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(kenBurnsScale, {
            toValue: 1,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(kenBurnsTranslateX, {
            toValue: 0,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(kenBurnsTranslateY, {
            toValue: 0,
            duration: 12000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [visible]);

  // Card subtle float
  useEffect(() => {
    if (!visible) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: -6,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [visible]);

  const playAudio = async () => {
    try {
      if (!musicUrl) return;
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: musicUrl },
        { shouldPlay: true, isLooping: true, volume: 0.7 }
      );
      soundRef.current = sound;
      setIsAudioPlaying(true);
    } catch (error) {
      console.error('[ShareCard] Audio playback failed:', error);
    }
  };

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsAudioPlaying(false);
      }
    } catch (error) {
      console.error('[ShareCard] Audio stop failed:', error);
    }
  };

  const handleClose = () => {
    stopAudio();
    onClose();
  };

  const captureCard = async (): Promise<string | null> => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      return uri || null;
    } catch (error) {
      console.error('Capture failed:', error);
      Alert.alert('Error', 'Failed to create share image');
      return null;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to save.'
      );
      return false;
    }
    return true;
  };

  // Save static card image
  const handleSaveCard = async () => {
    setIsProcessing(true);
    setProcessingType('card');
    try {
      const capturedUri = await captureCard();
      if (!capturedUri) return;
      if (!(await requestPermission())) return;

      await MediaLibrary.saveToLibraryAsync(capturedUri);
      Alert.alert('Saved!', 'Card image saved to your photos.', [
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Save card failed:', error);
      Alert.alert('Error', 'Failed to save card');
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  // Save video (calls backend to compose mp4)
  const handleSaveVideo = async () => {
    setIsProcessing(true);
    setProcessingType('video');
    try {
      if (!musicUrl) {
        Alert.alert('No Music', 'Music URL is not available yet.');
        return;
      }

      // Capture the card image to send to backend
      const capturedUri = await captureCard();
      if (!capturedUri) return;
      if (!(await requestPermission())) return;

      // Upload card image + audio URL to backend for video composition
      console.log('[ShareCard] Requesting video generation...');
      const uploadResult = await FileSystem.uploadAsync(
        `${API_BASE_URL}/api/generate-share-video`,
        capturedUri,
        {
          httpMethod: 'POST',
          uploadType: 1, // MULTIPART
          fieldName: 'image',
          parameters: {
            audio_url: musicUrl,
            title: trackTitle,
            duration: '15',
          },
        }
      );

      if (uploadResult.status !== 200) {
        throw new Error(`Server error: ${uploadResult.status}`);
      }

      const data = JSON.parse(uploadResult.body);
      if (!data.video_url) {
        throw new Error('No video URL in response');
      }

      // Download the generated video
      const videoUrl = `${API_BASE_URL}${data.video_url}`;
      const localVideoPath = `${FileSystem.documentDirectory}melody_snap_share_${Date.now()}.mp4`;

      console.log('[ShareCard] Downloading video:', videoUrl);
      const downloadResult = await FileSystem.downloadAsync(videoUrl, localVideoPath);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed: ${downloadResult.status}`);
      }

      // Save to photo library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      Alert.alert('Saved!', 'Video saved to your photos.', [{ text: 'OK' }]);
      console.log('[ShareCard] Video saved to library');
    } catch (error) {
      console.error('Save video failed:', error);
      Alert.alert('Error', 'Failed to generate video. Try saving the card instead.');
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.screen}>
        {/* Full-screen blurred background */}
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={40}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Floating particles */}
        <Particle delay={0} startX={SCREEN_WIDTH * 0.1} size={4} />
        <Particle delay={800} startX={SCREEN_WIDTH * 0.3} size={3} />
        <Particle delay={1600} startX={SCREEN_WIDTH * 0.55} size={5} />
        <Particle delay={2400} startX={SCREEN_WIDTH * 0.75} size={3} />
        <Particle delay={3200} startX={SCREEN_WIDTH * 0.9} size={4} />
        <Particle delay={600} startX={SCREEN_WIDTH * 0.45} size={3} />

        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
              <BlurView intensity={30} tint="dark" style={styles.headerBtnBlur}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Share</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Main content area */}
          <View style={styles.contentArea}>
            {/* Polaroid Card with ViewShot for capture */}
            <Animated.View style={{ transform: [{ translateY: cardFloat }] }}>
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 1 }}
              >
                <View style={styles.polaroidCard}>
                  {/* Photo with Ken Burns */}
                  <View style={styles.photoFrame}>
                    <Animated.Image
                      source={{ uri: imageUri }}
                      style={[
                        styles.photo,
                        {
                          transform: [
                            { scale: kenBurnsScale },
                            { translateX: kenBurnsTranslateX },
                            { translateY: kenBurnsTranslateY },
                          ],
                        },
                      ]}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.15)']}
                      style={styles.photoGradient}
                    />
                  </View>

                  {/* Caption area */}
                  <View style={styles.captionArea}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {trackTitle}
                    </Text>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {tags.slice(0, 4).map((tag, i) => (
                          <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Brand footer inside card */}
                  <View style={styles.cardFooter}>
                    <View style={styles.brandRow}>
                      <View style={styles.logoCircle}>
                        <Ionicons name="musical-notes" size={8} color="#FFF" />
                      </View>
                      <Text style={styles.brandText}>MELODY SNAP</Text>
                    </View>
                  </View>
                </View>
              </ViewShot>
            </Animated.View>

            {/* Audio Visualizer */}
            {isAudioPlaying && (
              <View style={styles.visualizerWrapper}>
                <AudioVisualizer />
              </View>
            )}
          </View>

          {/* Bottom action buttons */}
          <View style={styles.actionsArea}>
            {/* Save Video Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={handleSaveVideo}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing && processingType === 'video' ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="videocam" size={20} color="#FFF" />
                  <Text style={styles.primaryBtnText}>Save Video</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Save Card Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={handleSaveCard}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing && processingType === 'card' ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={20} color="#FFF" />
                  <Text style={styles.secondaryBtnText}>Save Card</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ============================================
// Styles
// ============================================
const CARD_W = SCREEN_WIDTH * 0.78;
const PHOTO_H = CARD_W * 1.1;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    height: 56,
  },
  headerBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerBtnBlur: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
  },
  headerTitle: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 18,
    color: '#FFF',
    letterSpacing: 0.5,
  },

  // Content
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 24,
  },

  // Polaroid Card
  polaroidCard: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 14,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 25,
  },
  photoFrame: {
    width: '100%',
    height: PHOTO_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F0EDE5',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
  },

  // Caption
  captionArea: {
    paddingTop: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  songTitle: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 20,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 2,
  },
  songSubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(255, 183, 178, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 178, 0.3)',
  },
  tagText: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 11,
    color: COLORS.primaryAccent,
  },

  // Card footer
  cardFooter: {
    paddingTop: 12,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 10,
    color: '#78716C',
    letterSpacing: 1.5,
  },

  // Visualizer
  visualizerWrapper: {
    width: CARD_W,
    alignItems: 'center',
  },

  // Actions
  actionsArea: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryAccent,
  },
  primaryBtnText: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 16,
    color: '#FFF',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryBtnText: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 16,
    color: '#FFF',
  },
});
