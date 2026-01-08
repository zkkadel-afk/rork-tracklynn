import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Truck, RefreshCw, Sparkles } from 'lucide-react-native';
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
      <ExpoLinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <ExpoLinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoIcon}
                >
                  <Truck size={28} color={Colors.black} strokeWidth={2.5} />
                </ExpoLinearGradient>
                <View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.titleOrange}>Track</Text>
                    <Text style={styles.titleYellow}>lynn</Text>
                  </View>
                  <Text style={styles.subtitle}>Automatic Customer Updates</Text>
                </View>
              </View>
              <View style={styles.badge}>
                <Sparkles size={14} color={Colors.secondary} />
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
                <View style={styles.infoHeader}>
                  <Sparkles size={20} color={Colors.secondary} />
                  <Text style={styles.infoTitle}>How it works</Text>
                </View>
                <View style={styles.infoStep}>
                  <ExpoLinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepNumber}
                  >
                    <Text style={styles.stepNumberText}>1</Text>
                  </ExpoLinearGradient>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Upload Screenshot</Text>
                    <Text style={styles.stepDesc}>
                      Take screenshots of your TMS showing shipment data with BOL, customer, status, and location columns (up to 3 images)
                    </Text>
                  </View>
                </View>
                <View style={styles.infoStep}>
                  <ExpoLinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepNumber}
                  >
                    <Text style={styles.stepNumberText}>2</Text>
                  </ExpoLinearGradient>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>AI Extracts Data</Text>
                    <Text style={styles.stepDesc}>
                      Our AI reads the screenshot and extracts PO#s, locations, and statuses automatically
                    </Text>
                  </View>
                </View>
                <View style={styles.infoStep}>
                  <ExpoLinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepNumber}
                  >
                    <Text style={styles.stepNumberText}>3</Text>
                  </ExpoLinearGradient>
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
      </ExpoLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  titleContainer: {
    flexDirection: 'row',
  },
  titleOrange: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.primary,
    letterSpacing: -1,
  },
  titleYellow: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.secondary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  reprocessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.cardBg,
  },
  reprocessText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  infoStep: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.black,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
