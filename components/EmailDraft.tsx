import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Copy, Check, Edit3, Share2 } from 'lucide-react-native';
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

    group.shipments.forEach((shipment, index) => {
      const po = shipment.poNumber;
      const location = shipment.currentLocation === 'N/A' ? 'Currently Unavailable' : shipment.currentLocation;
      const eta = shipment.eta === 'N/A' ? 'Currently Unavailable' : shipment.eta;
      const temp = (shipment.reeferTemp && shipment.reeferTemp.trim() ? shipment.reeferTemp : 'Dry');
      
      body += `Load ${index + 1}:\n`;
      body += `  • PO #: ${po}\n`;
      body += `  • Current Location: ${location}\n`;
      body += `  • ETA: ${eta}\n`;
      body += `  • Reefer Temp: ${temp}\n\n`;
    });

    body += `Please let me know if you have any questions or need additional information.\n\n`;
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

  const shareEmail = async (group: CustomerGroup, emailBody: string) => {
    console.log('Sharing email...');
    try {
      const subject = getSubjectLine(group.customer);
      const recipient = recipientEmails[group.customer] || '';
      const message = recipient ? `To: ${recipient}\n\nSubject: ${subject}\n\n${emailBody}` : `Subject: ${subject}\n\n${emailBody}`;
      
      await Share.share({
        message,
        title: subject,
      });
    } catch (error) {
      console.error('Error sharing email:', error);
    }
  };

  return (
    <View style={styles.wrapper}>
      {customerGroups.map((group, index) => {
        const emailBody = generateEmailBody(group);
        const isCopied = copiedIndex === index;
        
        return (
          <View key={group.customer} style={styles.container}>
            <View style={styles.header}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIcon}
              >
                <Mail size={20} color={Colors.black} strokeWidth={2.5} />
              </LinearGradient>
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

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => shareEmail(group, emailBody)}
                >
                  <Share2 size={20} color={Colors.text} strokeWidth={2.5} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>

                {isCopied ? (
                  <TouchableOpacity
                    style={styles.copyButtonSuccess}
                    onPress={() => copyToClipboard(index, emailBody)}
                  >
                    <Check size={20} color={Colors.white} strokeWidth={2.5} />
                    <Text style={styles.copyButtonTextSuccess}>Copied!</Text>
                  </TouchableOpacity>
                ) : (
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.copyButton}
                  >
                    <TouchableOpacity
                      style={styles.copyButtonInner}
                      onPress={() => copyToClipboard(index, emailBody)}
                    >
                      <Copy size={20} color={Colors.black} strokeWidth={2.5} />
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                )}
              </View>
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
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
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
  },
  content: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  subjectText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600' as const,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bodyText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  copyButton: {
    flex: 1,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  copyButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  copyButtonSuccess: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 14,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.black,
  },
  copyButtonTextSuccess: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.white,
  },
});
