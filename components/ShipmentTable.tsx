import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Truck, MapPin, Clock, Building2, Thermometer } from 'lucide-react-native';
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
        <Truck size={20} color={Colors.accent} />
        <Text style={styles.headerTitle}>Shipment Updates</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{shipments.length} loads</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.poCell]}>PO #</Text>
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
                    {shipment.destination === 'N/A' ? 'Currently Unavailable' : shipment.destination}
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
                <Text style={styles.cellText}>{shipment.reeferTemp || 'Currently Unavailable'}</Text>
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  table: {
    minWidth: 820,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.tableHeader,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  cellText: {
    fontSize: 13,
    color: Colors.text,
  },
  destType: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
