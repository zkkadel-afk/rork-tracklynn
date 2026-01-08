import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Truck, RefreshCw, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import ImageUploader from '@/components/ImageUploader';
import ShipmentTable from '@/components/ShipmentTable';
import EmailDraft from '@/components/EmailDraft';
import {
  extractShipmentData,
  processShipments,
  groupByCustomer,
} from '@/utils/extractShipmentData';
import { ProcessedShipment, CustomerGroup } from '@/types/shipment';

export default function HomeScreen() {
  const [images, setImages] = useState<{ uri: string; base64: string }[]>([]);
  const [shipments, setShipments] = useState<ProcessedShipment[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);

  const extractMutation = useMutation({
    mutationFn: async (base64Images: string[]) => {
      console.log('Starting extraction mutation...');
      const allRawData = await Promise.all(
        base64Images.map(base64 => extractShipmentData(base64))
      );
      const rawData = allRawData.flat();
      
      // Deduplicate by BOL - keep only the first occurrence
      const seenBols = new Set<string>();
      const uniqueRawData = rawData.filter((shipment) => {
        const bol = shipment.bol.trim().toUpperCase();
        if (seenBols.has(bol)) {
          console.log('Duplicate BOL found and skipped:', shipment.bol);
          return false;
        }
        seenBols.add(bol);
        return true;
      });
      console.log(`Deduplicated: ${rawData.length} -> ${uniqueRawData.length} shipments`);
      
      const processed = await processShipments(uniqueRawData);
      const grouped = groupByCustomer(processed);
      return { processed, grouped };
    },
    onSuccess: (data) => {
      console.log('Extraction successful:', data.processed.length, 'shipments');
      setShipments(data.processed);
      setCustomerGroups(data.grouped);
    },
    onError: (error) => {
      console.error('Extraction failed:', error);
      Alert.alert(
        'Extraction Failed',
        'Could not extract data from the screenshot. Please ensure the image contains clear shipment data with the expected column headers.'
      );
    },
  });

  const handleImagesSelected = (newImages: { uri: string; base64: string }[]) => {
    console.log('Images selected');
    setImages(newImages);
    setShipments([]);
    setCustomerGroups([]);
  };

  const handleStartExtraction = () => {
    if (images.length > 0) {
      console.log('Starting extraction...');
      extractMutation.mutate(images.map(img => img.base64));
    }
  };

  const handleClear = () => {
    console.log('Clearing all data...');
    setImages([]);
    setShipments([]);
    setCustomerGroups([]);
  };

  const handleReprocess = () => {
    if (images.length > 0) {
      console.log('Reprocessing images...');
      extractMutation.mutate(images.map(img => img.base64));
    }
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Truck size={24} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.title}>Tracklynn</Text>
                <Text style={styles.subtitle}>Automatic Customer Updates</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Zap size={12} color={Colors.warning} />
              <Text style={styles.badgeText}>AI Powered</Text>
            </View>
          </View>

          <View style={styles.card}>
            <ImageUploader
              images={images}
              onImagesSelected={handleImagesSelected}
              onClear={handleClear}
              isProcessing={extractMutation.isPending}
              onStartExtraction={handleStartExtraction}
            />
          </View>

          {shipments.length > 0 && (
            <>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.reprocessButton}
                  onPress={handleReprocess}
                  disabled={extractMutation.isPending}
                >
                  <RefreshCw size={16} color={Colors.primary} />
                  <Text style={styles.reprocessText}>Re-extract Data</Text>
                </TouchableOpacity>
              </View>

              <ShipmentTable shipments={shipments} />
              <EmailDraft customerGroups={customerGroups} />
            </>
          )}

          {images.length === 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How it works</Text>
              <View style={styles.infoStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Upload Screenshot</Text>
                  <Text style={styles.stepDesc}>
                    Take screenshots of your TMS showing shipment data with BOL, customer, status, and location columns (up to 3 images)
                  </Text>
                </View>
              </View>
              <View style={styles.infoStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>AI Extracts Data</Text>
                  <Text style={styles.stepDesc}>
                    Our AI reads the screenshot and extracts PO#s, locations, and statuses automatically
                  </Text>
                </View>
              </View>
              <View style={styles.infoStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Get Email Draft</Text>
                  <Text style={styles.stepDesc}>
                    Copy the pre-formatted email update grouped by customer, ready to send
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  reprocessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reprocessText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  infoStep: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
