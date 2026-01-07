import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Mail, Copy, Check, Edit3 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { CustomerGroup } from '@/types/shipment';

interface EmailDraftProps {
  customerGroups: CustomerGroup[];
}

export default function EmailDraft({ customerGroups }: EmailDraftProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [recipientEmails, setRecipientEmails] = useState<Record<string, string>>({});

  if (customerGroups.length === 0) {
    return null;
  }

  const generateEmailBody = (group: CustomerGroup) => {
    let body = `Good afternoon,\n\nPlease see below for today's shipment updates:\n\n`;

    const poWidth = 15;
    const locationWidth = 30;
    const etaWidth = 30;
    const tempWidth = 12;

    body += `${'PO #'.padEnd(poWidth)} | ${'Current Location'.padEnd(locationWidth)} | ${'ETA'.padEnd(etaWidth)} | ${'Reefer Temp'.padEnd(tempWidth)}\n`;
    body += `${'-'.repeat(poWidth)}-+-${'-'.repeat(locationWidth)}-+-${'-'.repeat(etaWidth)}-+-${'-'.repeat(tempWidth)}\n`;

    group.shipments.forEach((shipment) => {
      const po = shipment.poNumber.padEnd(poWidth);
      const location = shipment.currentLocation.padEnd(locationWidth);
      const eta = shipment.eta.padEnd(etaWidth);
      const temp = (shipment.reeferTemp || 'N/A').padEnd(tempWidth);
      body += `${po} | ${location} | ${eta} | ${temp}\n`;
    });

    body += `\nPlease let me know if you have any questions or need additional information.\n\n`;
    body += `Best regards`;

    return body;
  };

  const getSubjectLine = (customerName: string) => {
    return `${customerName} - ${new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const copyToClipboard = async (index: number, emailBody: string) => {
    console.log('Copying email to clipboard...');
    await Clipboard.setStringAsync(emailBody);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const updateRecipientEmail = (customer: string, email: string) => {
    setRecipientEmails(prev => ({ ...prev, [customer]: email }));
  };

  return (
    <View style={styles.wrapper}>
      {customerGroups.map((group, index) => {
        const emailBody = generateEmailBody(group);
        const isCopied = copiedIndex === index;
        
        return (
          <View key={group.customer} style={styles.container}>
            <View style={styles.header}>
              <Mail size={20} color={Colors.accent} />
              <Text style={styles.headerTitle}>Email Draft - {group.customer}</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>To:</Text>
                <TextInput
                  style={styles.input}
                  value={recipientEmails[group.customer] || ''}
                  onChangeText={(text) => updateRecipientEmail(group.customer, text)}
                  placeholder="Enter recipient email..."
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Subject:</Text>
                <Text style={styles.subjectText}>
                  {getSubjectLine(group.customer)}
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.bodyHeader}>
                  <Text style={styles.label}>Message:</Text>
                  <TouchableOpacity style={styles.editHint}>
                    <Edit3 size={14} color={Colors.textMuted} />
                    <Text style={styles.editHintText}>Editable</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.bodyContainer} nestedScrollEnabled>
                  <Text style={styles.bodyText} selectable>
                    {emailBody}
                  </Text>
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.copyButton, isCopied && styles.copyButtonSuccess]}
                onPress={() => copyToClipboard(index, emailBody)}
              >
                {isCopied ? (
                  <>
                    <Check size={18} color={Colors.white} />
                    <Text style={styles.copyButtonText}>Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={18} color={Colors.white} />
                    <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
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
  },
  content: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subjectText: {
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bodyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editHintText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bodyContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 14,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bodyText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  copyButtonSuccess: {
    backgroundColor: Colors.success,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
