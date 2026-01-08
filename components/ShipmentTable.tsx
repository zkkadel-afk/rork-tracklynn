import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck, MapPin, Clock, Building2, Thermometer, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ProcessedShipment } from '@/types/shipment';

interface ShipmentTableProps {
  shipments: ProcessedShipment[];
}

export default function ShipmentTable({ shipments }: ShipmentTableProps) {
  if (shipments.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'IN-TRANS') return Colors.success;
    if (s === 'COVRD' || s === 'DISPATCH') return Colors.warning;
    return Colors.textSecondary;
  };

  const getStatusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'IN-TRANS') return 'In Transit';
    if (s === 'COVRD') return 'Covered';
    if (s === 'DISPATCH') return 'Dispatched';
    return status;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIcon}
        >
          <Truck size={20} color={Colors.black} strokeWidth={2.5} />
        </LinearGradient>
        <Text style={styles.headerTitle}>Shipment Updates</Text>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{shipments.length} loads</Text>
        </LinearGradient>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.poCell]}>PO #</Text>
            <Text style={[styles.headerCell, styles.customerCell]}>Customer</Text>
            <Text style={[styles.headerCell, styles.locationCell]}>Current Location</Text>
            <Text style={[styles.headerCell, styles.destCell]}>Destination</Text>
            <Text style={[styles.headerCell, styles.etaCell]}>ETA</Text>
            <Text style={[styles.headerCell, styles.tempCell]}>Reefer Temp</Text>
            <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
          </View>

          {shipments.map((shipment, index) => (
            <View
              key={`${shipment.poNumber}-${index}`}
              style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? Colors.tableRowEven : Colors.tableRowOdd },
              ]}
            >
              <View style={[styles.cell, styles.poCell]}>
                <Text style={styles.poText}>{shipment.poNumber}</Text>
              </View>
              <View style={[styles.cell, styles.customerCell]}>
                <User size={14} color={Colors.textSecondary} />
                <Text style={styles.cellText}>{shipment.customer}</Text>
              </View>
              <View style={[styles.cell, styles.locationCell]}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.cellText}>
                  {shipment.currentLocation === 'N/A' ? 'Currently Unavailable' : shipment.currentLocation}
                </Text>
              </View>
              <View style={[styles.cell, styles.destCell]}>
                <Building2 size={14} color={Colors.textSecondary} />
                <View>
                  <Text style={styles.cellText}>
                    {shipment.destination}
                  </Text>
                  <Text style={styles.destType}>
                    ({shipment.destinationType === 'shipper' ? 'Shipper' : 'Receiver'})
                  </Text>
                </View>
              </View>
              <View style={[styles.cell, styles.etaCell]}>
                <Clock size={14} color={Colors.accent} />
                <Text style={styles.etaText}>
                  {shipment.eta === 'N/A' ? 'Currently Unavailable' : shipment.eta}
                </Text>
              </View>
              <View style={[styles.cell, styles.tempCell]}>
                <Thermometer size={14} color={Colors.textSecondary} />
                <Text style={styles.cellText}>
                  {shipment.reeferTemp && shipment.reeferTemp.trim() ? shipment.reeferTemp : 'Dry'}
                </Text>
              </View>
              <View style={[styles.cell, styles.statusCell]}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shipment.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(shipment.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(shipment.status) }]}>
                    {getStatusLabel(shipment.status)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.black,
  },
  table: {
    minWidth: 960,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  poCell: {
    width: 100,
  },
  customerCell: {
    width: 140,
  },
  locationCell: {
    width: 150,
  },
  destCell: {
    width: 180,
  },
  etaCell: {
    width: 140,
  },
  tempCell: {
    width: 120,
  },
  statusCell: {
    width: 120,
  },
  poText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  cellText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  destType: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
