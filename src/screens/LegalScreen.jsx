import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from '../components/Icons';
import { useSettings } from '../hooks';

// Helper to assign intuitive icons to policy sections based on keywords
const getSectionIcon = (title, index) => {
  const lower = (title || '').toLowerCase();
  if (lower.includes('isi') || lower.includes('product') || lower.includes('quality') || lower.includes('spec')) return '⚡';
  if (lower.includes('price') || lower.includes('gst') || lower.includes('bill') || lower.includes('invoice')) return '📑';
  if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('logistics') || lower.includes('site') || lower.includes('dispatch')) return '🚚';
  if (lower.includes('technician') || lower.includes('install') || lower.includes('service')) return '🛠️';
  if (lower.includes('return') || lower.includes('refund') || lower.includes('cancel')) return '🔄';
  if (lower.includes('warranty') || lower.includes('guarantee') || lower.includes('support')) return '🛡️';
  if (lower.includes('liability') || lower.includes('safety') || lower.includes('disclaimer')) return '⚠️';
  if (lower.includes('law') || lower.includes('jurisdiction') || lower.includes('dispute')) return '⚖️';
  if (lower.includes('collect') || lower.includes('information')) return '📋';
  if (lower.includes('use') || lower.includes('usage')) return '⚙️';
  if (lower.includes('payment') || lower.includes('card') || lower.includes('financial')) return '💳';
  if (lower.includes('share') || lower.includes('third')) return '🤝';
  if (lower.includes('cookie') || lower.includes('storage')) return '🍪';
  if (lower.includes('security') || lower.includes('protection')) return '🔐';
  if (lower.includes('right') || lower.includes('delete') || lower.includes('control')) return '🗑️';
  if (lower.includes('update') || lower.includes('change')) return '📢';
  if (lower.includes('contact') || lower.includes('grievance') || lower.includes('officer')) return '📞';

  const defaultIcons = ['📌', '🔹', '⚡', '🛡️', '📋', '🚚', '💳', '🛠️', '⚖️', '📞'];
  return defaultIcons[index % defaultIcons.length];
};

// Formats timestamp cleanly for policy version display
const formatLastUpdated = (dateString) => {
  if (!dateString) return 'NOVEMBER 2026';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'NOVEMBER 2026';
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
      day: 'numeric',
    }).toUpperCase();
  } catch (_e) {
    return 'NOVEMBER 2026';
  }
};

// Parses inline **bold** text into styled native Text components
const renderFormattedInlineText = (text, baseStyle, boldStyle) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <Text key={index} style={[baseStyle, boldStyle]}>
          {boldText}
        </Text>
      );
    }
    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
};

// Splits raw backend markdown into structured card blocks
const parseMarkdownIntoCards = (markdownText) => {
  if (!markdownText || typeof markdownText !== 'string') return [];
  const lines = markdownText.split('\n');
  const cards = [];
  let currentCard = {
    title: '',
    items: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line || line === '---') {
      continue;
    }

    // Skip top level title if it matches # Title (already shown in header banner)
    if (line.startsWith('# ') && !line.startsWith('### ')) {
      continue;
    }

    if (line.startsWith('### ') || line.startsWith('## ')) {
      if (currentCard.title || currentCard.items.length > 0) {
        cards.push(currentCard);
      }
      currentCard = {
        title: line.replace(/^#{2,3}\s+/, '').trim(),
        items: [],
      };
      continue;
    }

    if (line.startsWith('* ') || line.startsWith('- ')) {
      currentCard.items.push({
        type: 'bullet',
        text: line.replace(/^[*\-]\s+/, '').trim(),
      });
    } else {
      currentCard.items.push({
        type: 'paragraph',
        text: line,
      });
    }
  }

  if (currentCard.title || currentCard.items.length > 0) {
    cards.push(currentCard);
  }

  return cards;
};

export default function LegalScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialTab = route?.params?.type === 'privacy' ? 'privacy' : 'terms';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const {
    storeName = 'ElectricalFix',
    supportPhone = '+91 98765 43210',
    supportEmail = 'support@electricalfix.in',
    gstin = '19AAACV1234F1Z5',
    termsAndConditions,
    privacyPolicy,
    officeAddress = 'Sector V, Salt Lake',
    city = 'Kolkata',
    state = 'West Bengal',
    pincode = '700091',
    isLoading,
    isRefetching,
    refetch,
  } = useSettings();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
    } catch (_e) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate('MainTabs');
    }
  };

  const parsedTermsCards = useMemo(() => {
    return parseMarkdownIntoCards(termsAndConditions?.content);
  }, [termsAndConditions?.content]);

  const parsedPrivacyCards = useMemo(() => {
    return parseMarkdownIntoCards(privacyPolicy?.content);
  }, [privacyPolicy?.content]);

  const isTerms = activeTab === 'terms';
  const activeTitle = isTerms
    ? termsAndConditions?.title || 'Terms & Conditions'
    : privacyPolicy?.title || 'Privacy Policy';
  const activeUpdated = formatLastUpdated(
    isTerms ? termsAndConditions?.lastUpdated : privacyPolicy?.lastUpdated
  );
  const activeCards = isTerms ? parsedTermsCards : parsedPrivacyCards;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={18} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <View>
            <Text style={styles.headerTitle}>Legal & Policies</Text>
            <Text style={styles.headerSubtitle}>{storeName} Official</Text>
          </View>
        </View>

        {isRefetching && (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 4 }} />
        )}
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, isTerms && styles.tabButtonActive]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabButtonText, isTerms && styles.tabButtonTextActive]}
          >
            Terms & Conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, !isTerms && styles.tabButtonActive]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabButtonText, !isTerms && styles.tabButtonTextActive]}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Intro Summary Header */}
        <View style={styles.introCard}>
          <View style={styles.badgeRow}>
            <View style={styles.liveSyncBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>LIVE BACKEND SYNC • {activeUpdated}</Text>
            </View>
          </View>
          <Text style={styles.introTitle}>{activeTitle}</Text>
          <Text style={styles.introDesc}>
            {isTerms
              ? `These terms govern your purchase of electrical supplies, machinery parts, fittings, and certified on-site technician bookings through the ${storeName} platform.`
              : `How ${storeName} safeguards your personal information, delivery addresses, and payment data with strict HttpOnly encryption.`}
          </Text>
        </View>

        {/* Initial Loading Spinner */}
        {isLoading && !termsAndConditions && !privacyPolicy ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Fetching latest policies from {storeName}...</Text>
          </View>
        ) : null}

        {/* Render Backend Parsed Cards */}
        {activeCards.length > 0 ? (
          activeCards.map((card, cardIndex) => {
            // Render un-titled preamble as top overview block
            if (!card.title) {
              return (
                <View key={`preamble-${cardIndex}`} style={styles.preambleCard}>
                  {card.items.map((item, itemIdx) => (
                    <Text key={itemIdx} style={styles.preambleText}>
                      {renderFormattedInlineText(item.text, styles.preambleText, styles.boldText)}
                    </Text>
                  ))}
                </View>
              );
            }

            const icon = getSectionIcon(card.title, cardIndex);

            return (
              <View key={`sec-${cardIndex}`} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>{icon}</Text>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                </View>

                {card.items.map((item, itemIdx) => {
                  if (item.type === 'bullet') {
                    return (
                      <View key={itemIdx} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>
                          {renderFormattedInlineText(item.text, styles.cardBody, styles.boldText)}
                        </Text>
                      </View>
                    );
                  }
                  return (
                    <Text key={itemIdx} style={styles.paragraphText}>
                      {renderFormattedInlineText(item.text, styles.cardBody, styles.boldText)}
                    </Text>
                  );
                })}
              </View>
            );
          })
        ) : (
          /* Graceful Fallback if backend returned empty string */
          isTerms ? (
            <>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>⚡</Text>
                  <Text style={styles.cardTitle}>1. 100% Genuine & ISI Certified Products</Text>
                </View>
                <Text style={styles.cardBody}>
                  All electrical components, cables, switchgears, circuit breakers, and lighting solutions
                  supplied via {storeName} are brand-new, genuine, and compliant with relevant Indian
                  Standards (ISI / BIS). We do not stock or deliver counterfeit, refurbished, or unauthorized parts.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>📑</Text>
                  <Text style={styles.cardTitle}>2. Pricing, GST & Tax Invoices</Text>
                </View>
                <Text style={styles.cardBody}>
                  Prices displayed include or specify statutory Goods and Services Tax (GST). Every completed
                  order generates an official tax invoice referencing operating entity {storeName} (GSTIN: {gstin}).
                  Registered commercial entities and electrical contractors may claim eligible Input Tax Credit (ITC)
                  by entering their valid GSTIN during checkout.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🚚</Text>
                  <Text style={styles.cardTitle}>3. Site Delivery & Inspection</Text>
                </View>
                <Text style={styles.cardBody}>
                  Deliveries are dispatched directly to specified site or residential addresses. Customers or
                  their appointed site supervisors are required to inspect the exterior seal and packaging
                  upon delivery before accepting handover.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🛠️</Text>
                  <Text style={styles.cardTitle}>4. Certified Installation Services</Text>
                </View>
                <Text style={styles.cardBody}>
                  Installation and electrical maintenance services are fulfilled exclusively by vetted, trade-certified
                  technicians. Adequate site safety, power isolation access, and proper permissions must be provided
                  prior to commencement of technical operations.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🔄</Text>
                  <Text style={styles.cardTitle}>5. 7-Day Replacements & Returns</Text>
                </View>
                <Text style={styles.cardBody}>
                  Standard unopened products in original factory condition are eligible for return or replacement
                  within 7 days of delivery. Custom-cut wires, custom DB switch assemblies, and consumable joint kits
                  are non-returnable once dispatched.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>⚖️</Text>
                  <Text style={styles.cardTitle}>6. Governing Law & Jurisdiction</Text>
                </View>
                <Text style={styles.cardBody}>
                  These terms are governed by the laws of India. Any disputes arising from transactions or services
                  shall be subject to the exclusive jurisdiction of the competent courts in {city}, {state}.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🛡️</Text>
                  <Text style={styles.cardTitle}>1. Zero Card & PIN Storage</Text>
                </View>
                <Text style={styles.cardBody}>
                  {storeName} never stores, logs, or views your payment card numbers, CVVs, net banking credentials,
                  or UPI PINs. Online transactions are processed through PCI-DSS Level 1 compliant secure payment gateways.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>📋</Text>
                  <Text style={styles.cardTitle}>2. Information We Collect</Text>
                </View>
                <Text style={styles.cardBody}>
                  We only collect information necessary to fulfill orders and service bookings: your full name,
                  email address, phone number, physical site delivery address, and optional business details (Company Name & GSTIN).
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🔐</Text>
                  <Text style={styles.cardTitle}>3. HttpOnly Session Security & Encryption</Text>
                </View>
                <Text style={styles.cardBody}>
                  All communications between our mobile/web application and servers are secured using SSL/TLS 1.3 encryption.
                  Authentication sessions are managed using strict HttpOnly cookies, protecting your account against cross-site scripting (XSS)
                  and preventing unauthorized access from local storage.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🤝</Text>
                  <Text style={styles.cardTitle}>4. Limited Third-Party Sharing</Text>
                </View>
                <Text style={styles.cardBody}>
                  Your personal information is never sold, leased, or rented to third-party marketing agencies.
                  Data is shared exclusively with our logistics dispatch team and assigned technicians strictly to complete deliveries and service appointments.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>🗑️</Text>
                  <Text style={styles.cardTitle}>5. User Rights & Data Deletion</Text>
                </View>
                <Text style={styles.cardBody}>
                  You maintain the right to review, update, or permanently delete your account and associated profile data at any time.
                  To request permanent data deletion, please contact our support team at {supportEmail}.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardIcon}>📍</Text>
                  <Text style={styles.cardTitle}>6. Grievance Officer & Contact</Text>
                </View>
                <Text style={styles.cardBody}>
                  {storeName} Customer Support & Privacy Operations:{'\n'}
                  Address: {officeAddress}, {city}, {state} - {pincode}{'\n'}
                  Helpline: {supportPhone}{'\n'}
                  Email: {supportEmail}
                </Text>
              </View>
            </>
          )
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </Text>
          <Text style={styles.footerSubText}>
            GSTIN: {gstin} • {city}, {state}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 12,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  introCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.4,
  },
  introTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1e3a8a',
    lineHeight: 25,
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 21,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  preambleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  preambleText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    lineHeight: 21,
  },
  cardBody: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 22,
  },
  paragraphText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 22,
    marginTop: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    color: '#2563eb',
    marginRight: 10,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
    gap: 4,
  },
  footerNoteText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerSubText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
});
