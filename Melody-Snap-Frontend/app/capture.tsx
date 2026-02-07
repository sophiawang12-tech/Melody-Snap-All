import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { generateSongTask } from './services/sunoService';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function CreateScreen() {
  // Permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  // State
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
      if (!mediaPermission?.granted) await requestMediaPermission();
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Actions
  const toggleCameraType = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current && cameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true 
        });
        if (photo) {
            setCapturedImage(photo.uri);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleUpload = async () => {
    if (!capturedImage) return;
    
    // Navigate immediately to Player screen with only imageUri
    // Player screen will handle image compression and upload
    router.push({
      pathname: '/player',
      params: { imageUri: capturedImage }
    });
  };

  // Render Content
  return (
    <View style={styles.container}>
      <StatusBar style="light" /> 
      {/* Camera usually looks better with dark status bar overlay, but UI is light */}
      <Stack.Screen options={{ headerShown: false }} />

      {capturedImage ? (
        // STATE B: Image Review (Light Theme Overlay)
        <View style={styles.fullScreen}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="cover" />
          
          <SafeAreaView style={styles.overlayContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={handleRetake} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text.dark} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Review</Text>
              </View>
              <View style={{ width: 44 }} /> 
            </View>

            <View style={styles.reviewControls}>
              <TouchableOpacity onPress={handleRetake} style={styles.reviewButtonSecondary}>
                <Text style={styles.reviewButtonTextSecondary}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleUpload} 
                disabled={isUploading}
                style={[styles.reviewButtonPrimary, isUploading && styles.disabledButton]}
              >
                {isUploading ? (
                  <ActivityIndicator color={COLORS.text.dark} />
                ) : (
                  <Text style={styles.reviewButtonTextPrimary}>USE PHOTO</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        // STATE A: Camera Preview
        <CameraView 
          style={styles.camera} 
          facing={facing} 
          ref={cameraRef}
          onCameraReady={() => setCameraReady(true)}
        >
          <SafeAreaView style={styles.overlayContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonGlass}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity onPress={pickImage} style={styles.sideButton}>
                <View style={styles.glassCircle}>
                   <Ionicons name="images-outline" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={takePicture} style={styles.shutterContainer}>
                <View style={styles.shutterOuter}>
                  <View style={styles.shutterInner} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleCameraType} style={styles.sideButton}>
                 <View style={styles.glassCircle}>
                    <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
                 </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.text.dark,
  },
  permissionButton: {
    backgroundColor: COLORS.primaryAccent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 32,
  },
  permissionButtonText: {
    fontFamily: FONTS.primary.semiBold,
    color: COLORS.text.dark,
  },
  camera: {
    flex: 1,
  },
  fullScreen: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: COLORS.background, 
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
  },
  titleText: {
    fontFamily: FONTS.primary.semiBold,
    fontSize: 16,
    color: COLORS.text.dark,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  iconButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
  },
  sideButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shutterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shutterInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF',
  },
  reviewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 24,
  },
  reviewButtonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    ...SHADOWS.soft,
  },
  reviewButtonTextSecondary: {
    fontFamily: FONTS.primary.semiBold,
    color: COLORS.text.muted,
    fontSize: 14,
  },
  reviewButtonPrimary: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 32,
    backgroundColor: COLORS.primaryAccent,
    ...SHADOWS.pulse,
  },
  reviewButtonTextPrimary: {
    fontFamily: FONTS.primary.semiBold,
    color: COLORS.text.dark,
    fontSize: 16,
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
