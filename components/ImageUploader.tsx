import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Upload, X, Truck, Eye } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageUploaderProps {
  images: { uri: string; base64: string }[];
  onImagesSelected: (images: { uri: string; base64: string }[]) => void;
  onClear: () => void;
  isProcessing: boolean;
  onStartExtraction: () => void;
  progressMessage: string;
  showSuccess: boolean;
}

export default function ImageUploader({
  images,
  onImagesSelected,
  onClear,
  isProcessing,
  onStartExtraction,
  progressMessage,
  showSuccess,
}: ImageUploaderProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const pickImage = async () => {
    if (images.length >= 3) {
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Opening image picker...');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      console.log('Images selected:', result.assets.length);
      const newImages = result.assets
        .filter(asset => asset.base64)
        .map(asset => ({ uri: asset.uri, base64: asset.base64! }))
        .slice(0, 3 - images.length);
      
      if (newImages.length > 0) {
        onImagesSelected([...images, ...newImages]);
      }
    }
  };

  const removeImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newImages = images.filter((_, i) => i !== index);
    onImagesSelected(newImages);
  };

  const openPreview = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewVisible(false);
  };

function LoadingTruck({ progressMessage }: { progressMessage: string }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.processingOverlay}>
      <View style={styles.truckContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }, { scale: pulseValue }] }}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.truckGradient}
          >
            <Truck size={56} color={Colors.black} strokeWidth={2.5} />
          </LinearGradient>
        </Animated.View>
      </View>
      <Text style={styles.processingText}>Working On Your Updates</Text>
      <Text style={styles.progressMessage}>{progressMessage}</Text>
    </View>
  );
}

function SuccessAnimation() {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleValue, opacityValue, checkScale]);

  return (
    <View style={styles.processingOverlay}>
      <Animated.View
        style={[
          styles.successContainer,
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.successGradient}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      <Text style={styles.successText}>Extraction Complete!</Text>
      <Text style={styles.successSubtext}>Your data is ready</Text>
    </View>
  );
}

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Upload Screenshots</Text>
          <Text style={styles.sectionSubtitle}>
            Upload up to 3 screenshots from your TMS showing shipment data
          </Text>
        </View>
        {images.length > 0 && !isProcessing && (
          <TouchableOpacity style={styles.clearAllButton} onPress={onClear}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {images.length > 0 && (
        <View style={styles.imagesGrid}>
          {images.map((image, index) => (
            <View key={index} style={styles.previewContainer}>
              <TouchableOpacity 
                style={styles.previewTouchable}
                onPress={() => openPreview(index)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
                <View style={styles.previewBadge}>
                  <Eye size={14} color={Colors.white} />
                </View>
              </TouchableOpacity>
              {!isProcessing && (
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color={Colors.white} />
                </TouchableOpacity>
              )}
              <View style={styles.imageNumber}>
                <Text style={styles.imageNumberText}>{index + 1}</Text>
              </View>
            </View>
          ))}
          {images.length < 3 && !isProcessing && (
            <TouchableOpacity style={styles.addMoreButton} onPress={pickImage}>
              <Upload size={24} color={Colors.primary} />
              <Text style={styles.addMoreText}>Add More</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {images.length > 0 && !isProcessing && (
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startButton}
        >
          <TouchableOpacity 
            style={styles.startButtonInner} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onStartExtraction();
            }}
          >
            <Text style={styles.startButtonText}>Start Extraction</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {isProcessing && !showSuccess && <LoadingTruck progressMessage={progressMessage} />}
      {showSuccess && <SuccessAnimation />}

      {images.length === 0 && (
        <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadIconContainer}
          >
            <Upload size={40} color={Colors.black} strokeWidth={2.5} />
          </LinearGradient>
          <Text style={styles.uploadTitle}>Upload Screenshots</Text>
          <Text style={styles.uploadHint}>Select up to 3 images from your files</Text>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadButton}
          >
            <View style={styles.uploadButtonInner}>
              <Upload size={20} color={Colors.black} strokeWidth={2.5} />
              <Text style={styles.uploadButtonText}>Choose Files</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.previewModal}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Image {previewIndex + 1} of {images.length}</Text>
            <TouchableOpacity 
              style={styles.closePreviewButton} 
              onPress={closePreview}
            >
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={previewIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.previewSlide}>
                <Image 
                  source={{ uri: item.uri }} 
                  style={styles.previewImage} 
                  resizeMode="contain" 
                />
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setPreviewIndex(newIndex);
            }}
          />
          <View style={styles.previewDots}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.previewDot,
                  index === previewIndex && styles.previewDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    backgroundColor: Colors.accentGlow,
  },
  uploadIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  uploadTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  uploadHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  uploadButton: {
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  uploadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.black,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  previewContainer: {
    position: 'relative',
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 14,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNumber: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNumberText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.black,
  },
  addMoreButton: {
    width: '48%',
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  truckContainer: {
    marginBottom: 8,
  },
  truckGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  processingText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  progressMessage: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.secondary,
    fontWeight: '700' as const,
  },
  successContainer: {
    marginBottom: 8,
  },
  successGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  checkmark: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: Colors.black,
  },
  successText: {
    marginTop: 20,
    fontSize: 22,
    color: Colors.text,
    fontWeight: '800' as const,
  },
  successSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  startButton: {
    marginTop: 20,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonInner: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.black,
  },
  previewTouchable: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewModal: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  closePreviewButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSlide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  previewDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  previewDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
});
