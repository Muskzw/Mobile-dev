import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows, Colors } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../config';

export default function DocumentViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { token, currentCompany } = useAuthStore();
  const styles = createStyles(colors);
  const { id } = route.params as { id: string };
  const queryClient = useQueryClient();
  const [downloadLoading, setDownloadLoading] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showOptionsModal, setShowOptionsModal] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailBody, setEmailBody] = React.useState('');
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [statusLoading, setStatusLoading] = React.useState<string | null>(null);

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await api.get(`/documents/${id}`);
      return response.data;
    }
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/documents/${id}`);
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              navigation.goBack();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    (navigation as any).navigate('DocumentCreate', {
      type: document?.type || 'QUOTATION',
      editMode: true,
      documentId: id
    });
  };

  const handleDuplicate = async () => {
    try {
      setDownloadLoading(true);
      const response = await api.post(`/documents/${id}/duplicate`);
      const newDoc = response.data;

      queryClient.invalidateQueries({ queryKey: ['documents'] });

      Alert.alert('Success', 'Document duplicated successfully', [
        {
          text: 'View New Document',
          onPress: () => {
            (navigation as any).push('DocumentView', { id: newDoc.id });
          }
        },
        { text: 'OK', style: 'cancel' }
      ]);
    } catch (error) {
      console.error('Duplicate error:', error);
      Alert.alert('Error', 'Failed to duplicate document');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setStatusLoading(newStatus);
    try {
      if (newStatus === 'convert') {
        const response = await api.post(`/documents/${id}/convert`, { targetType: 'invoice' });
        const newDoc = response.data;
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        setShowOptionsModal(false);
        
        Alert.alert('Success', 'Quotation converted to Invoice successfully!', [
          {
            text: 'View Invoice',
            onPress: () => {
              (navigation as any).push('DocumentView', { id: newDoc.id });
            }
          },
          { text: 'OK', style: 'cancel' }
        ]);
        return;
      }

      await api.put(`/documents/${id}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowOptionsModal(false);
    } catch (error) {
      console.error('Status update error:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setStatusLoading(null);
    }
  };

  // Returns the quick-action buttons relevant to the current doc type & status
  const getStatusActions = () => {
    const status = document?.status?.toLowerCase();
    const type = document?.type?.toLowerCase();
    const actions: { label: string; status: string; color: string; icon: string }[] = [];

    if (status === 'draft') {
      actions.push({ label: 'Mark Sent', status: 'sent', color: colors.primary[600], icon: 'send-outline' });
    }
    if (status !== 'paid' && (type === 'invoice' || type === 'receipt' || type === 'proforma')) {
      actions.push({ label: 'Mark Paid', status: 'paid', color: colors.success, icon: 'checkmark-circle-outline' });
    }
    if (type === 'quotation' && status !== 'accepted' && status !== 'rejected') {
      actions.push({ label: 'Accepted', status: 'accepted', color: colors.success, icon: 'thumbs-up-outline' });
      actions.push({ label: 'Rejected', status: 'rejected', color: colors.error, icon: 'thumbs-down-outline' });
    }
    if (status === 'accepted' && type === 'quotation') {
      actions.push({ label: 'Convert to Invoice', status: 'convert', color: colors.secondary[600], icon: 'receipt-outline' });
    }
    return actions;
  };

  const showMenu = () => {
    setShowOptionsModal(true);
  };

  // Helper function to download PDF
  const downloadPDF = async (): Promise<string | null> => {
    try {
      console.log('Starting PDF download for document:', id);

      if (!document) {
        Alert.alert('Error', 'Document data is not available');
        return null;
      }

      if (!token) {
        Alert.alert('Error', 'Not authenticated. Please log in again.');
        return null;
      }

      console.log('Token found from auth store');
      const fileName = `${document.document_number || 'document'}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      console.log('Download URL:', `${api.defaults.baseURL}/documents/${id}/pdf`);

      const downloadRes = await FileSystem.downloadAsync(
        `${api.defaults.baseURL}/documents/${id}/pdf`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Download response status:', downloadRes.status);

      if (downloadRes.status === 200) {
        console.log('PDF downloaded successfully to:', downloadRes.uri);
        return downloadRes.uri;
      } else {
        Alert.alert('Error', `Failed to download PDF. Status: ${downloadRes.status}`);
        return null;
      }
    } catch (error: any) {
      console.error('PDF Download Error:', error);
      Alert.alert('Download Error', `Failed to download PDF: ${error.message || 'Unknown error'}`);
      return null;
    }
  };

  // Send Direct Email
  // Send Direct Email
  const handleDirectEmail = () => {
    if (!document?.client?.email) {
      Alert.alert('Error', 'Client does not have an email address');
      return;
    }

    setShowShareModal(false);

    const subjectTemplate = currentCompany?.emailSubjectTemplate || `${document.type} #{documentNumber} from {companyName}`;
    const bodyTemplate = currentCompany?.emailBodyTemplate || `Dear {clientName},\n\nPlease find attached ${document.type.toLowerCase()} #{documentNumber}.\n\nBest regards,\n{companyName}`;

    const replacements: Record<string, string> = {
      '{documentNumber}': document.document_number,
      '{clientName}': document.client.name,
      '{companyName}': currentCompany?.name || 'Us',
    };

    let subject = subjectTemplate;
    let body = bodyTemplate;

    Object.entries(replacements).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    });

    setEmailSubject(subject);
    setEmailBody(body);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      await api.post(`/documents/${id}/email`, {
        subject: emailSubject,
        body: emailBody
      });
      Alert.alert('Success', 'Email sent successfully');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Email send error:', error);
      Alert.alert('Error', 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = async () => {
    try {
      setDownloadLoading(true);
      setShowShareModal(false);

      const fileUri = await downloadPDF();
      if (!fileUri) return;

      const docType = document?.type?.charAt(0).toUpperCase() + document?.type?.slice(1).replace('_', ' ') || 'Document';
      const message = `Hello! Please find your ${docType} ${document?.document_number}.\n\nTotal: ${document?.currency} ${parseFloat(document?.total || 0).toFixed(2)}`;

      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        setTimeout(async () => {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Share via WhatsApp',
              UTI: 'com.adobe.pdf'
            });
          }
        }, 500);
      } else {
        Alert.alert('WhatsApp Not Available', 'Please install WhatsApp to use this feature.');
      }
    } catch (error: any) {
      console.error('WhatsApp share error:', error);
      Alert.alert('Error', 'Failed to share via WhatsApp');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Share via Email
  const handleEmailShare = async () => {
    try {
      setDownloadLoading(true);
      setShowShareModal(false);

      const fileUri = await downloadPDF();
      if (!fileUri) return;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `${document?.document_number}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', `PDF saved to: ${fileUri}`);
      }
    } catch (error: any) {
      console.error('Email share error:', error);
      Alert.alert('Error', 'Failed to share via email');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Download locally
  const handleLocalDownload = async () => {
    try {
      setDownloadLoading(true);
      setShowShareModal(false);

      const fileUri = await downloadPDF();
      if (!fileUri) return;

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (sharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Document',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', `PDF saved to: ${fileUri}`);
      }
    } catch (error: any) {
      console.error('Local download error:', error);
      Alert.alert('Error', 'Failed to download PDF');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'overdue': return colors.error;
      default: return colors.gray[500];
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background.secondary}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Banner */}
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(document?.status)}15` }]}>
          <Ionicons
            name={
              document?.status?.toLowerCase() === 'paid' ? 'checkmark-circle' :
                document?.status?.toLowerCase() === 'pending' ? 'time' :
                  document?.status?.toLowerCase() === 'overdue' ? 'alert-circle' :
                    'document-text'
            }
            size={20}
            color={getStatusColor(document?.status)}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.statusText, { color: getStatusColor(document?.status) }]}>
            {document?.status}
          </Text>
        </View>

        {/* Company Preview Section */}
        {currentCompany && (
          <Card style={styles.sectionCard} padding={6}>
            <Text style={styles.label}>COMPANY DETAILS</Text>
            <View style={styles.companyContainer}>
              {currentCompany.logo_url ? (
                <Image
                  source={{ uri: `${BASE_URL}${currentCompany.logo_url}` }}
                  style={styles.companyLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.companyLogoPlaceholder}>
                  <Text style={styles.companyLogoText}>
                    {currentCompany.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{currentCompany.name}</Text>
                {currentCompany.email && <Text style={styles.companyDetail}>{currentCompany.email}</Text>}
                {currentCompany.address && <Text style={styles.companyDetail}>{currentCompany.address}</Text>}
              </View>
            </View>
          </Card>
        )}

        {/* Document Info */}
        <Card style={styles.sectionCard} padding={6}>
          <View style={styles.docHeader}>
            <View>
              <Text style={styles.label}>Document Number</Text>
              <Text style={styles.value}>{document?.document_number}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>
                {new Date(document?.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Client</Text>
          <Text style={styles.clientName}>{document?.client?.name || 'Unknown Client'}</Text>
          <Text style={styles.clientDetail}>{document?.client?.email}</Text>
          {document?.client?.address && (
            <Text style={styles.clientDetail}>{document?.client?.address}</Text>
          )}
        </Card>

        {/* Items */}
        <Text style={styles.sectionTitle}>Items</Text>
        <Card style={styles.sectionCard} padding={0}>
          {document?.items?.map((item: any, index: number) => (
            <View key={index} style={[
              styles.itemRow,
              index !== document.items.length - 1 && styles.itemBorder
            ]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.description}</Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} x {document.currency} {parseFloat(item.unit_price).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {document.currency} {parseFloat(item.total).toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Totals */}
        <Card style={styles.sectionCard} padding={6}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {document?.currency} {parseFloat(document?.subtotal || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({document?.tax_rate}%)</Text>
            <Text style={styles.totalValue}>
              {document?.currency} {parseFloat(document?.tax_amount || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {document?.currency} {parseFloat(document?.total || 0).toFixed(2)}
            </Text>
          </View>
        </Card>

        {/* Terms & Notes */}
        {(document?.terms || document?.notes) && (
          <View style={{ marginBottom: spacing[6] }}>
            <Text style={styles.sectionTitle}>Terms & Notes</Text>
            <Card style={styles.sectionCard} padding={4}>
              <Text style={styles.termsText}>{document.terms || document.notes}</Text>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Actions Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        {/* Quick Status Actions */}
        {getStatusActions().length > 0 && (
          <View style={styles.statusActions}>
            {getStatusActions().map((action) => (
              <TouchableOpacity
                key={action.status}
                style={[styles.statusActionBtn, { borderColor: action.color, backgroundColor: `${action.color}12` }]}
                onPress={() => handleStatusUpdate(action.status)}
                disabled={statusLoading !== null}
              >
                {statusLoading === action.status ? (
                  <ActivityIndicator size="small" color={action.color} />
                ) : (
                  <Ionicons name={action.icon as any} size={16} color={action.color} />
                )}
                <Text style={[styles.statusActionText, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.footerButtons}>
          <Button
            title="Edit"
            onPress={handleEdit}
            variant="outline"
            style={{ flex: 1, marginRight: spacing[3] }}
            icon={<Ionicons name="create-outline" size={20} color={colors.primary[600]} />}
          />
          <Button
            title="Share"
            onPress={() => setShowShareModal(true)}
            gradient
            loading={downloadLoading}
            style={{ flex: 2, marginRight: spacing[3] }}
            icon={<Ionicons name="share-outline" size={20} color="white" />}
          />
          <TouchableOpacity
            style={styles.moreButton}
            onPress={showMenu}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowShareModal(false)}
        >
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Share Document</Text>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleDirectEmail}
              disabled={downloadLoading}
            >
              <View style={[styles.shareIcon, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="send" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionText}>Send Direct Email</Text>
                <Text style={styles.shareOptionDesc}>Send directly to client</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleWhatsAppShare}
              disabled={downloadLoading}
            >
              <View style={[styles.shareIcon, { backgroundColor: '#25D366' + '15' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionText}>WhatsApp</Text>
                <Text style={styles.shareOptionDesc}>Share via WhatsApp</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleEmailShare}
              disabled={downloadLoading}
            >
              <View style={[styles.shareIcon, { backgroundColor: colors.info[100] }]}>
                <Ionicons name="mail" size={24} color={colors.info[600]} />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionText}>Email</Text>
                <Text style={styles.shareOptionDesc}>Send via email</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleLocalDownload}
              disabled={downloadLoading}
            >
              <View style={[styles.shareIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="download" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionText}>Download</Text>
                <Text style={styles.shareOptionDesc}>Save to device</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Email</Text>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>To: {document?.client?.email}</Text>

              <Input
                label="Subject"
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Subject"
              />

              <Input
                label="Message"
                value={emailBody}
                onChangeText={setEmailBody}
                multiline
                numberOfLines={6}
                placeholder="Message"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setShowEmailModal(false)}
                variant="ghost"
                style={{ flex: 1, marginRight: spacing[2] }}
              />
              <Button
                title="Send"
                onPress={handleSendEmail}
                gradient
                style={{ flex: 1 }}
                loading={sendingEmail}
                icon="send"
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Document Options</Text>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => {
                setShowOptionsModal(false);
                handleEdit();
              }}
            >
              <View style={[styles.shareIcon, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="create-outline" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionText}>Edit Document</Text>
                <Text style={styles.shareOptionDesc}>Make changes to this document</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => {
                setShowOptionsModal(false);
                handleDuplicate();
              }}
            >
              <View style={[styles.shareIcon, { backgroundColor: colors.secondary[50] }]}>
                <Ionicons name="copy-outline" size={24} color={colors.secondary[600]} />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionText}>Duplicate</Text>
                <Text style={styles.shareOptionDesc}>Create a copy of this document</Text>
              </View>
            </TouchableOpacity>

            {document?.status !== 'paid' ? (
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleStatusUpdate('paid')}
              >
                <View style={[styles.shareIcon, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                </View>
                <View style={styles.shareOptionTextContainer}>
                  <Text style={styles.shareOptionText}>Mark as Paid</Text>
                  <Text style={styles.shareOptionDesc}>Update status to paid</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleStatusUpdate('draft')}
              >
                <View style={[styles.shareIcon, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="time-outline" size={24} color={colors.warning} />
                </View>
                <View style={styles.shareOptionTextContainer}>
                  <Text style={styles.shareOptionText}>Mark as Draft</Text>
                  <Text style={styles.shareOptionDesc}>Update status to draft</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => {
                setShowOptionsModal(false);
                handleDelete();
              }}
            >
              <View style={[styles.shareIcon, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={[styles.shareOptionText, { color: colors.error }]}>Delete</Text>
                <Text style={styles.shareOptionDesc}>Permanently remove this document</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    backgroundColor: colors.background.secondary,
  },
  backButton: {
    padding: spacing[2],
  },
  menuButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing[6],
    paddingBottom: 100,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[6],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  sectionCard: {
    marginBottom: spacing[6],
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  companyName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  companyDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    marginRight: spacing[4],
  },
  companyLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  companyLogoText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  companyInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing[4],
  },
  clientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  clientDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  itemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  itemTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  grandTotalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  statusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  statusActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  moreButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary[600]}15`,
    borderWidth: 1,
    borderColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  shareModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  shareOptionTextContainer: {
    flex: 1,
  },
  shareOptionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  shareOptionDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  cancelButton: {
    marginTop: spacing[4],
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    margin: spacing[4],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: spacing[4],
  },
});
