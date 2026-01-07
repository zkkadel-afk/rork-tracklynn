import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X, Scissors } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ImageUploaderProps {
  images: { uri: string; base64: string }[];
  onImagesSelected: (images: { uri: string; base64: string }[]) => void;
  onClear: () => void;
  isProcessing: boolean;
}

export default function ImageUploader({
  images,
  onImagesSelected,
  onClear,
  isProcessing,
}: ImageUploaderProps) {
  const captureScreen = async () => {
    if (images.length >= 3) {
      Alert.alert('Maximum reached', 'You can only capture up to 3 screenshots');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Not available', 'Screen capture is only available on web. Use the camera or upload instead.');
      return;
    }

    try {
      console.log('Starting screen capture...');
      
      if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
        Alert.alert(
          'Screen Capture Not Available',
          'Screen capture is not supported in this browser. Please use the "Upload from files" option instead.'
        );
        return;
      }

      const mediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { mediaSource: 'screen' },
      });

      const video = document.createElement('video');
      video.srcObject = mediaStream;
      video.play();

      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

      const base64 = canvas.toDataURL('image/png').split(',')[1];
      const uri = canvas.toDataURL('image/png');

      console.log('Screen captured successfully');
      onImagesSelected([...images, { uri, base64 }]);
    } catch (error: any) {
      console.error('Screen capture error:', error);
      if (error.name === 'NotAllowedError') {
        Alert.alert(
          'Screen Capture Blocked',
          'Screen capture is blocked by your browser or this environment. Please use the "Upload from files" option to upload screenshots instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Capture failed', 'Could not capture screen. Please try uploading an image instead.');
      }
    }
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      return;
    }
    
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
    const newImages = images.filter((_, i) => i !== index);
    onImagesSelected(newImages);
  };

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
              <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
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

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.processingText}>Extracting data from {images.length} screenshot{images.length > 1 ? 's' : ''}...</Text>
        </View>
      )}

      {images.length === 0 && (
        <View>
          <TouchableOpacity style={styles.captureArea} onPress={captureScreen}>
            <View style={styles.captureIconContainer}>
              <Scissors size={32} color={Colors.primary} />
            </View>
            <Text style={styles.captureTitle}>Capture Your Screen</Text>
            <Text style={styles.captureHint}>Click to snippet your TMS or any window</Text>
            <View style={styles.captureButton}>
              <Scissors size={18} color={Colors.white} />
              <Text style={styles.captureButtonText}>Start Capture</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.uploadAreaSecondary} onPress={pickImage}>
            <Upload size={20} color={Colors.textSecondary} />
            <Text style={styles.uploadSecondaryText}>Upload from files</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  previewContainer: {
    position: 'relative',
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNumber: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  addMoreButton: {
    width: '48%',
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureArea: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.primary + '08',
  },
  captureIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  captureHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  captureButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  uploadAreaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  uploadSecondaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
});
