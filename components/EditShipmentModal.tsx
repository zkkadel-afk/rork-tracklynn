import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Edit3 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ProcessedShipment } from '@/types/shipment';

interface EditShipmentModalProps {
  visible: boolean;
  shipment: ProcessedShipment | null;
  onClose: () => void;
  onSave: (updatedShipment: ProcessedShipment) => void;
}

export default function EditShipmentModal({
  visible,
  shipment,
  onClose,
  onSave,
}: EditShipmentModalProps) {
  const [poNumber, setPoNumber] = useState('');
  const [customer, setCustomer] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationType, setDestinationType] = useState<'shipper' | 'receiver'>('receiver');
  const [eta, setEta] = useState('');
  const [status, setStatus] = useState('');
  const [reeferTemp, setReeferTemp] = useState('');

  useEffect(() => {
    if (shipment) {
      setPoNumber(shipment.poNumber);
      setCustomer(shipment.customer);
      setCurrentLocation(shipment.currentLocation);
      setDestination(shipment.destination);
      setDestinationType(shipment.destinationType);
      setEta(shipment.eta);
      setStatus(shipment.status);
      setReeferTemp(shipment.reeferTemp || '');
    }
  }, [shipment]);

  const handleSave = () => {
    if (!shipment) return;

    const updatedShipment: ProcessedShipment = {
      ...shipment,
      poNumber: poNumber.trim(),
      customer: customer.trim(),
      currentLocation: currentLocation.trim(),
      destination: destination.trim(),
      destinationType,
      eta: eta.trim(),
      status: status.trim(),
      reeferTemp: reeferTemp.trim() || undefined,
    };

    onSave(updatedShipment);
    onClose();
  };

  if (!shipment) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIcon}
                >
                  <Edit3 size={18} color={Colors.black} strokeWidth={2.5} />
                </LinearGradient>
                <Text style={styles.modalTitle}>Edit Shipment</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PO Number</Text>
                  <TextInput
                    style={styles.input}
                    value={poNumber}
                    onChangeText={setPoNumber}
                    placeholder="Enter PO number"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Customer</Text>
                  <TextInput
                    style={styles.input}
                    value={customer}
                    onChangeText={setCustomer}
                    placeholder="Enter customer name"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Location</Text>
                  <TextInput
                    style={styles.input}
                    value={currentLocation}
                    onChangeText={setCurrentLocation}
                    placeholder="Enter current location"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Destination</Text>
                  <TextInput
                    style={styles.input}
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="Enter destination"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Destination Type</Text>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        destinationType === 'shipper' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setDestinationType('shipper')}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          destinationType === 'shipper' && styles.toggleTextActive,
                        ]}
                      >
                        Shipper
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        destinationType === 'receiver' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setDestinationType('receiver')}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          destinationType === 'receiver' && styles.toggleTextActive,
                        ]}
                      >
                        Receiver
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ETA</Text>
                  <TextInput
                    style={styles.input}
                    value={eta}
                    onChangeText={setEta}
                    placeholder="Enter ETA"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Status</Text>
                  <TextInput
                    style={styles.input}
                    value={status}
                    onChangeText={setStatus}
                    placeholder="Enter status"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reefer Temp (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={reeferTemp}
                    onChangeText={setReeferTemp}
                    placeholder="Enter temperature or leave empty for Dry"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Save size={18} color={Colors.black} strokeWidth={2.5} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  formScroll: {
    maxHeight: 500,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.black,
  },
});
