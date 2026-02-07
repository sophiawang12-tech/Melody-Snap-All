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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, FONTS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 16 / 9;

interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
  shareUrl: string;
  trackTitle?: string;
  trackSubtitle?: string;
}

export default function ShareCardModal({
  visible,
  onClose,
  imageUri,
  shareUrl,
  trackTitle = 'Sunset Dreams',
  trackSubtitle = 'AI Composer',
}: ShareCardModalProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim1 = useRef(new Animated.Value(0.3)).current;
  const pulseAnim2 = useRef(new Animated.Value(0.3)).current;
  const pulseAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Float animation (6s cycle)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animations (4s cycles with delays)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim1, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim1, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(pulseAnim2, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim2, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(pulseAnim3, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim3, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const captureCard = async (): Promise<string | null> => {
    try {
      setIsProcessing(true);
      const uri = await viewShotRef.current?.capture?.();
      setIsProcessing(false);
      return uri || null;
    } catch (error) {
      console.error('Capture failed:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to create share image');
      return null;
    }
  };

  const handleSave = async () => {
    const capturedUri = await captureCard();
    if (!capturedUri) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to save images.'
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(capturedUri);
      Alert.alert('Success', 'Image saved to your photos!', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Symmetrical Navigation Buttons */}
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="light" style={styles.navButtonBlur}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.deep} />
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.downloadButton]}
          onPress={handleSave}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="light" style={styles.navButtonBlur}>
            {isProcessing ? (
              <ActivityIndicator color={COLORS.text.deep} />
            ) : (
              <Ionicons name="download-outline" size={24} color={COLORS.text.deep} />
            )}
          </BlurView>
        </TouchableOpacity>

        {/* Main Card (wrapped in ViewShot) */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1 }}
          style={styles.cardContainer}
        >
          <View style={styles.card}>
            {/* Abstract Background Elements */}
            <View style={styles.backgroundElements}>
              {/* Animated gradient orbs */}
              <Animated.View
                style={[
                  styles.gradientOrb,
                  styles.orb1,
                  { opacity: pulseAnim1 },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 183, 178, 0.2)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.gradientOrb,
                  styles.orb2,
                  { opacity: pulseAnim2 },
                ]}
              >
                <LinearGradient
                  colors={['rgba(239, 237, 244, 0.4)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.gradientOrb,
                  styles.orb3,
                  { opacity: pulseAnim3 },
                ]}
              >
                <LinearGradient
                  colors={['rgba(232, 239, 232, 0.5)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Floating music note */}
              <Animated.View
                style={[
                  styles.floatingIcon,
                  { transform: [{ translateY: floatAnim }] },
                ]}
              >
                <Ionicons
                  name="musical-notes"
                  size={32}
                  color={COLORS.peach}
                  style={{ opacity: 0.3 }}
                />
              </Animated.View>
            </View>

            {/* Main Content */}
            <View style={styles.cardContent}>
              {/* Polaroid Photo Card */}
              <View style={styles.polaroidFrame}>
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 183, 178, 0.15)']}
                    style={styles.photoOverlay}
                  />
                </View>

                {/* Track info inside polaroid */}
                <View style={styles.polaroidCaption}>
                  <Text style={styles.trackTitle}>{trackTitle}</Text>
                  <Text style={styles.trackSubtitle}>{trackSubtitle}</Text>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                {/* Brand Logo */}
                <View style={styles.brandLogo}>
                  <View style={styles.logoCircle}>
                    <Ionicons
                      name="musical-notes"
                      size={10}
                      color="#FFF"
                    />
                  </View>
                  <Text style={styles.brandName}>MELODY SNAP</Text>
                </View>
                <Text style={styles.scanLabel}>Scan to listen</Text>
              </View>

              {/* QR Code in Glass Container */}
              <View style={styles.qrGlassContainer}>
                <BlurView intensity={40} tint="light" style={styles.qrBlur}>
                  <View style={styles.qrInner}>
                    <QRCode
                      value={shareUrl}
                      size={80}
                      backgroundColor="white"
                      color="black"
                    />
                  </View>
                </BlurView>
              </View>
            </View>
          </View>
        </ViewShot>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.frameBg,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  
  // Navigation Buttons (Symmetrical)
  navButton: {
    position: 'absolute',
    top: 60,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    left: 24,
  },
  downloadButton: {
    right: 24,
  },
  navButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
  },

  // Main Card
  cardContainer: {
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 48,
    backgroundColor: COLORS.warmBg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },

  // Background Elements
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    top: -80,
    left: -80,
    width: 350,
    height: 350,
  },
  orb2: {
    top: '25%',
    right: -130,
    width: 450,
    height: 450,
  },
  orb3: {
    bottom: 80,
    left: -160,
    width: 400,
    height: 400,
  },
  floatingIcon: {
    position: 'absolute',
    top: 192,
    right: 40,
  },

  // Card Content
  cardContent: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  // Polaroid Frame
  polaroidFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 16,
    paddingBottom: 20,
    shadowColor: COLORS.peach,
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.2,
    shadowRadius: 50,
    elevation: 15,
  },
  photoContainer: {
    width: 224,
    height: 299, // 3:4 aspect ratio
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  polaroidCaption: {
    marginTop: 12,
    alignItems: 'center',
  },
  trackTitle: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 22,
    color: COLORS.text.deep,
    textAlign: 'center',
    marginBottom: 4,
  },
  trackSubtitle: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 16,
    color: 'rgba(60, 54, 51, 0.5)',
    textAlign: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 16,
  },
  footerLeft: {
    flex: 1,
    paddingBottom: 4,
  },
  brandLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logoCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.peach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontFamily: FONTS.primary.extraBold,
    fontSize: 12,
    color: COLORS.text.deep,
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  scanLabel: {
    fontFamily: FONTS.primary.regular,
    fontSize: 11,
    color: 'rgba(60, 54, 51, 0.4)',
    lineHeight: 11,
  },

  // QR Code Glass Container
  qrGlassContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    transform: [{ translateY: 5 }],
  },
  qrBlur: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 28,
  },
  qrInner: {
    width: 96,
    height: 96,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
