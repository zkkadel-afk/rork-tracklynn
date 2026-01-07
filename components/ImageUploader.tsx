import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X } from 'lucide-react-native';
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
        <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
          <View style={styles.uploadIconContainer}>
            <Upload size={32} color={Colors.primary} />
          </View>
          <Text style={styles.uploadTitle}>Upload Screenshots</Text>
          <Text style={styles.uploadHint}>Select up to 3 images from your files</Text>
          <View style={styles.uploadButton}>
            <Upload size={18} color={Colors.white} />
            <Text style={styles.uploadButtonText}>Choose Files</Text>
          </View>
        </TouchableOpacity>
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
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.primary + '08',
  },
  uploadIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
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
