import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Event = {
  id: number;
  date: string;
  month: string;
  badge: string;
  time: string;
  title: string;
  location: string;
  desc: string;
};

type Announcement = {
  id: number;
  badge: string;
  date: string;
  title: string;
  desc: string;
  featured?: boolean;
};

const initialEvents: Event[] = [
  {
    id: 1,
    date: '20',
    month: 'SEP',
    badge: 'Tournament',
    time: '2:00 PM – 8:00 PM',
    title: 'Fall Fighting Championship',
    location: 'GameVault Downtown',
    desc: 'Open brackets, prizes, local pros, and after-party. All skill levels welcome.',
  },
  {
    id: 2,
    date: '05',
    month: 'OCT',
    badge: 'Game Night',
    time: '6:00 PM',
    title: 'Retro Throwback Night',
    location: 'GameVault Northside',
    desc: 'Plug in the classics. SNES, Genesis, N64 — bring your own controller.',
  },
  {
    id: 3,
    date: '12',
    month: 'OCT',
    badge: 'New Release',
    time: '12:00 AM Launch',
    title: 'Midnight Release Party',
    location: 'All Locations',
    desc: 'Be first in line. Exclusive in-store bonuses for attendees.',
  },
];

const announcements: Announcement[] = [
  {
    id: 1,
    badge: 'Major Update',
    date: 'Aug 9',
    title: 'Extended warranty now covers screen repairs',
    desc: 'GameVault Protection+ now includes screen damage from drops in addition to manufacturer defects. Update takes effect immediately for new repairs.',
    featured: true,
  },
  {
    id: 2,
    badge: 'Community',
    date: 'Aug 6',
    title: 'Trade-in values boosted by 20% this month',
    desc: 'We\'re raising trade-in estimates on all consoles, controllers, and handheld systems through end of September.',
  },
  {
    id: 3,
    badge: 'Coming Soon',
    date: 'Aug 3',
    title: 'West End location expansion',
    desc: 'The West End store is expanding its repair bay — eight new technician stations and same-day service for tablets and consoles.',
  },
];

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [rsvps, setRsvps] = useState<Record<number, boolean>>({});
  const [events] = useState<Event[]>(initialEvents);

  const webTopPad = Platform.OS === 'web' ? 67 : 0;
  const webBottomPad = Platform.OS === 'web' ? 34 : 0;

  const handleRsvp = (id: number) => {
    Haptics.selectionAsync();
    const going = !rsvps[id];
    setRsvps((prev) => ({ ...prev, [id]: going }));
    if (going) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top + webTopPad }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerBadge}>GAMEVAULT</Text>
          <Text style={s.headerTitle}>
            Community <Text style={{ color: colors.primary }}>Hub</Text>
          </Text>
        </View>
        <View style={s.logoMark}>
          <Ionicons name="people" size={20} color={colors.primaryForeground} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 100 + webBottomPad }]}
      >
        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { num: '3', label: 'Events' },
            { num: '3', label: 'Updates' },
            { num: '3', label: 'Locations' },
          ].map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statNum}>{stat.num}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Announcements */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionBadge}>IMPORTANT UPDATES</Text>
            <Text style={s.sectionTitle}>Announcements</Text>
          </View>

          {announcements.map((ann) => (
            <AnnouncementCard key={ann.id} ann={ann} colors={colors} s={s} />
          ))}
        </View>

        {/* Events */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionBadge}>WHAT'S COMING UP</Text>
            <Text style={s.sectionTitle}>Community Events</Text>
          </View>

          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              isGoing={!!rsvps[ev.id]}
              onRsvp={() => handleRsvp(ev.id)}
              onDetails={() => Alert.alert(ev.title, ev.desc)}
              colors={colors}
              s={s}
            />
          ))}
        </View>

        {/* Promo banner */}
        <View style={s.promoBanner}>
          <View style={s.promoContent}>
            <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.promoTitle}>GameVault Protection+</Text>
              <Text style={s.promoDesc}>1-year warranty on every repair. Parts and labor guaranteed.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.promoBtn}
            onPress={() => Alert.alert('Protection+', 'Ask in-store or call us to enroll in GameVault Protection+.')}
            activeOpacity={0.8}
          >
            <Text style={s.promoBtnText}>LEARN MORE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function AnnouncementCard({ ann, colors, s }: { ann: Announcement; colors: ReturnType<typeof useColors>; s: ReturnType<typeof makeStyles> }) {
  const isFeatured = !!ann.featured;
  return (
    <View style={[s.annCard, isFeatured && s.annCardFeatured]}>
      <View style={s.annMeta}>
        <View style={[s.annBadge, isFeatured && s.annBadgeFeatured]}>
          <Text style={[s.annBadgeText, isFeatured && s.annBadgeTextFeatured]}>{ann.badge}</Text>
        </View>
        <Text style={[s.annDate, isFeatured && { color: colors.foreground }]}>{ann.date}</Text>
      </View>
      <Text style={[s.annTitle, isFeatured && { color: colors.foreground }]}>{ann.title}</Text>
      <Text style={[s.annDesc, isFeatured && { color: colors.mutedForeground }]}>{ann.desc}</Text>
    </View>
  );
}

function EventCard({ event, isGoing, onRsvp, onDetails, colors, s }: {
  event: Event;
  isGoing: boolean;
  onRsvp: () => void;
  onDetails: () => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={s.eventCard}>
      {/* Date badge */}
      <View style={s.dateBadge}>
        <Text style={s.dateBadgeMonth}>{event.month}</Text>
        <Text style={s.dateBadgeDay}>{event.date}</Text>
      </View>

      <View style={s.eventBody}>
        <View style={s.eventMeta}>
          <View style={s.eventTag}>
            <Text style={s.eventTagText}>{event.badge}</Text>
          </View>
          <View style={s.eventTimeRow}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={s.eventTime}>{event.time}</Text>
          </View>
        </View>
        <Text style={s.eventTitle}>{event.title}</Text>
        <View style={s.eventLocationRow}>
          <Feather name="map-pin" size={12} color={colors.primary} />
          <Text style={s.eventLocation}>{event.location}</Text>
        </View>
      </View>

      <View style={s.eventActions}>
        <TouchableOpacity
          style={[s.rsvpBtn, isGoing && s.rsvpBtnActive]}
          onPress={onRsvp}
          activeOpacity={0.8}
        >
          {isGoing && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
          <Text style={[s.rsvpBtnText, isGoing && { color: colors.primaryForeground }]}>
            {isGoing ? 'Going' : 'RSVP'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.detailsBtn} onPress={onDetails} activeOpacity={0.8}>
          <Text style={s.detailsBtnText}>Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
    },
    headerBadge: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter_900Black',
      color: colors.foreground,
    },
    logoMark: {
      width: 40,
      height: 40,
      backgroundColor: colors.primary,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: 20,
      gap: 0,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNum: {
      fontSize: 26,
      fontFamily: 'Inter_900Black',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 10,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
      letterSpacing: 0.5,
      marginTop: 2,
    },
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      marginBottom: 14,
    },
    sectionBadge: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 22,
      fontFamily: 'Inter_900Black',
      color: colors.foreground,
    },
    // Announcements
    annCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    annCardFeatured: {
      backgroundColor: colors.secondary,
      borderColor: colors.accent,
    },
    annMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    annBadge: {
      backgroundColor: colors.muted,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    annBadgeFeatured: {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    annBadgeText: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      letterSpacing: 1,
    },
    annBadgeTextFeatured: {
      color: colors.foreground,
    },
    annDate: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
    },
    annTitle: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 6,
      lineHeight: 20,
    },
    annDesc: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    // Events
    eventCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
      alignItems: 'flex-start',
    },
    dateBadge: {
      width: 50,
      height: 56,
      backgroundColor: colors.background,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      flexShrink: 0,
    },
    dateBadgeMonth: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 1,
    },
    dateBadgeDay: {
      fontSize: 22,
      fontFamily: 'Inter_900Black',
      color: colors.foreground,
      lineHeight: 26,
    },
    eventBody: {
      flex: 1,
    },
    eventMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
      flexWrap: 'wrap',
    },
    eventTag: {
      backgroundColor: colors.muted,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    eventTagText: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    eventTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    eventTime: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
    },
    eventTitle: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 4,
      lineHeight: 18,
    },
    eventLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    eventLocation: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
    },
    eventActions: {
      flexDirection: 'column',
      gap: 6,
      flexShrink: 0,
    },
    rsvpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    rsvpBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rsvpBtnText: {
      fontSize: 11,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      letterSpacing: 0.5,
    },
    detailsBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.muted,
    },
    detailsBtnText: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    // Promo banner
    promoBanner: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    promoContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      marginBottom: 14,
    },
    promoTitle: {
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 4,
    },
    promoDesc: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    promoBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    promoBtnText: {
      fontSize: 12,
      fontFamily: 'Inter_700Bold',
      color: colors.primaryForeground,
      letterSpacing: 1.5,
    },
  });
}
