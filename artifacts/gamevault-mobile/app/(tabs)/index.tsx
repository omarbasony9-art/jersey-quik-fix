import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const REPAIRS_KEY = 'gv_repairs_v1';

type Category = 'Phone' | 'Tablet' | 'Computer' | 'Gaming Console';
type RepairTicket = {
  id: string;
  ticket: string;
  category: string;
  brand: string;
  model: string;
  issue: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  status: string;
  createdAt: string;
};

const categories: { id: Category; label: string; icon: string; desc: string }[] = [
  { id: 'Phone', label: 'Phone', icon: 'phone-portrait-outline', desc: 'Screen, battery, camera & more' },
  { id: 'Tablet', label: 'Tablet', icon: 'tablet-portrait-outline', desc: 'Screens, charging & batteries' },
  { id: 'Computer', label: 'Computer', icon: 'laptop-outline', desc: 'Laptop & desktop repairs' },
  { id: 'Gaming Console', label: 'Console', icon: 'game-controller-outline', desc: 'HDMI, power & overheating' },
];

const brands = ['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'Nintendo', 'Other'];

const issuesByCategory: Record<Category, string[]> = {
  Phone: ['Cracked screen', 'Battery replacement', 'Charging port', 'Camera problem', 'Water damage'],
  Tablet: ['Cracked screen', 'Battery replacement', 'Charging issue', 'Button problem', 'Water damage'],
  Computer: ["Won't turn on", 'Broken screen', 'Running slow', 'Battery issue', 'Data recovery'],
  'Gaming Console': ['HDMI port repair', 'Overheating', 'Disc drive issue', 'Power problem', 'Controller issue'],
};

const emptyForm = {
  category: '' as Category | '',
  brand: '',
  model: '',
  issue: '',
  name: '',
  phone: '',
  email: '',
};

export default function RepairScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [ticketNumber, setTicketNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const webTopPad = Platform.OS === 'web' ? 67 : 0;
  const webBottomPad = Platform.OS === 'web' ? 34 : 0;

  const goNext = () => {
    Haptics.selectionAsync();
    setStep((s) => s + 1);
  };

  const goBack = () => {
    Haptics.selectionAsync();
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert('Missing info', 'Please enter your name and phone number.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const ticket = 'JQ-' + Math.floor(100000 + Math.random() * 900000);
    const entry: RepairTicket = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ticket,
      category: form.category as string,
      brand: form.brand,
      model: form.model,
      issue: form.issue,
      name: form.name,
      phone: form.phone,
      email: form.email,
      date: '',
      status: 'Checked In',
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = await AsyncStorage.getItem(REPAIRS_KEY);
      const existing: RepairTicket[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(REPAIRS_KEY, JSON.stringify([...existing, entry]));
    } catch {}
    setTicketNumber(ticket);
    setSubmitted(true);
  };

  const reset = () => {
    setForm(emptyForm);
    setStep(1);
    setSubmitted(false);
    setTicketNumber('');
  };

  const s = makeStyles(colors);

  if (submitted) {
    return (
      <View style={[s.container, { paddingTop: insets.top + webTopPad, paddingBottom: insets.bottom + 90 + webBottomPad }]}>
        <ScrollView contentContainerStyle={s.successScroll} showsVerticalScrollIndicator={false}>
          <View style={s.successCard}>
            <View style={s.successIcon}>
              <Ionicons name="checkmark" size={40} color={colors.primaryForeground} />
            </View>
            <Text style={s.successBadge}>REPAIR REQUEST CREATED</Text>
            <Text style={s.successTitle}>You're all set!</Text>
            <View style={s.ticketBox}>
              <Text style={s.ticketLabel}>YOUR TICKET NUMBER</Text>
              <Text style={s.ticketNumber}>{ticketNumber}</Text>
            </View>
            <Text style={s.successDesc}>
              Bring this ticket number when you drop off your device. We'll have your info ready.
            </Text>
            <View style={s.summaryBox}>
              <SummaryRow label="Device" value={`${form.brand} ${form.model}`} colors={colors} />
              <SummaryRow label="Category" value={form.category} colors={colors} />
              <SummaryRow label="Issue" value={form.issue} colors={colors} />
              <SummaryRow label="Name" value={form.name} colors={colors} />
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={reset} activeOpacity={0.8}>
              <Text style={s.primaryBtnText}>BOOK ANOTHER REPAIR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + webTopPad }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerBrand}>
          <View style={s.logoMark}>
            <Ionicons name="game-controller" size={18} color={colors.primaryForeground} />
          </View>
          <Text style={s.logoText}>GAMEVAULT</Text>
        </View>
        {step > 1 && (
          <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Step indicator */}
      <View style={s.stepBar}>
        {[1, 2, 3, 4].map((n) => (
          <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]} />
        ))}
        <Text style={s.stepLabel}>Step {step} of 4</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 100 + webBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <Step1
            colors={colors}
            s={s}
            selected={form.category}
            onSelect={(cat) => {
              setForm((f) => ({ ...f, category: cat, issue: '' }));
              goNext();
            }}
          />
        )}
        {step === 2 && (
          <Step2
            colors={colors}
            s={s}
            brand={form.brand}
            model={form.model}
            onBrandSelect={(b) => setForm((f) => ({ ...f, brand: b }))}
            onModelChange={(m) => setForm((f) => ({ ...f, model: m }))}
            onNext={() => {
              if (!form.brand) { Alert.alert('Select a brand', 'Please choose a manufacturer.'); return; }
              if (!form.model.trim()) { Alert.alert('Enter model', 'Please enter the device model.'); return; }
              goNext();
            }}
          />
        )}
        {step === 3 && (
          <Step3
            colors={colors}
            s={s}
            category={form.category as Category}
            selected={form.issue}
            onSelect={(issue) => {
              setForm((f) => ({ ...f, issue }));
              goNext();
            }}
          />
        )}
        {step === 4 && (
          <Step4
            colors={colors}
            s={s}
            form={form}
            onChange={(key, val) => setForm((f) => ({ ...f, [key]: val }))}
            onSubmit={handleSubmit}
          />
        )}
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  const s = makeStyles(colors);
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={s.summaryValue}>{value}</Text>
    </View>
  );
}

function Step1({ colors, s, selected, onSelect }: { colors: ReturnType<typeof useColors>; s: ReturnType<typeof makeStyles>; selected: string; onSelect: (cat: Category) => void }) {
  return (
    <View>
      <Text style={s.stepBadge}>START A REPAIR</Text>
      <Text style={s.stepTitle}>What needs{'\n'}<Text style={{ color: colors.primary }}>fixing?</Text></Text>
      <View style={s.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.categoryCard, selected === cat.id && s.categoryCardActive]}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.8}
          >
            <View style={[s.categoryIcon, selected === cat.id && s.categoryIconActive]}>
              <Ionicons name={cat.icon as any} size={28} color={selected === cat.id ? colors.primaryForeground : colors.primary} />
            </View>
            <Text style={s.categoryLabel}>{cat.label}</Text>
            <Text style={s.categoryDesc}>{cat.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Step2({ colors, s, brand, model, onBrandSelect, onModelChange, onNext }: {
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof makeStyles>;
  brand: string;
  model: string;
  onBrandSelect: (b: string) => void;
  onModelChange: (m: string) => void;
  onNext: () => void;
}) {
  return (
    <View>
      <Text style={s.stepBadge}>STEP 2</Text>
      <Text style={s.stepTitle}>Who made{'\n'}<Text style={{ color: colors.primary }}>it?</Text></Text>
      <View style={s.brandGrid}>
        {brands.map((b) => (
          <TouchableOpacity
            key={b}
            style={[s.brandChip, brand === b && s.brandChipActive]}
            onPress={() => { Haptics.selectionAsync(); onBrandSelect(b); }}
            activeOpacity={0.8}
          >
            <Text style={[s.brandChipText, brand === b && s.brandChipTextActive]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[s.fieldLabel, { marginTop: 24 }]}>MODEL</Text>
      <TextInput
        style={s.textInput}
        placeholder="e.g. iPhone 15 Pro"
        placeholderTextColor={colors.mutedForeground}
        value={model}
        onChangeText={onModelChange}
        autoCorrect={false}
      />
      <TouchableOpacity style={[s.primaryBtn, { marginTop: 24 }]} onPress={onNext} activeOpacity={0.8}>
        <Text style={s.primaryBtnText}>NEXT</Text>
        <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

function Step3({ colors, s, category, selected, onSelect }: {
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof makeStyles>;
  category: Category;
  selected: string;
  onSelect: (issue: string) => void;
}) {
  const issues = issuesByCategory[category] ?? [];
  return (
    <View>
      <Text style={s.stepBadge}>STEP 3</Text>
      <Text style={s.stepTitle}>What's the{'\n'}<Text style={{ color: colors.primary }}>issue?</Text></Text>
      <View style={{ gap: 10 }}>
        {issues.map((issue) => (
          <TouchableOpacity
            key={issue}
            style={[s.issueRow, selected === issue && s.issueRowActive]}
            onPress={() => onSelect(issue)}
            activeOpacity={0.8}
          >
            <View style={[s.issueCheck, selected === issue && s.issueCheckActive]}>
              {selected === issue && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
            </View>
            <Text style={[s.issueText, selected === issue && { color: colors.primary }]}>{issue}</Text>
            <Feather name="chevron-right" size={18} color={selected === issue ? colors.primary : colors.mutedForeground} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Step4({ colors, s, form, onChange, onSubmit }: {
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof makeStyles>;
  form: typeof emptyForm;
  onChange: (key: string, val: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View>
      <Text style={s.stepBadge}>STEP 4</Text>
      <Text style={s.stepTitle}>Your{'\n'}<Text style={{ color: colors.primary }}>info.</Text></Text>
      <Text style={s.fieldLabel}>FULL NAME *</Text>
      <TextInput
        style={s.textInput}
        placeholder="Your name"
        placeholderTextColor={colors.mutedForeground}
        value={form.name}
        onChangeText={(v) => onChange('name', v)}
      />
      <Text style={[s.fieldLabel, { marginTop: 16 }]}>PHONE NUMBER *</Text>
      <TextInput
        style={s.textInput}
        placeholder="(555) 000-0000"
        placeholderTextColor={colors.mutedForeground}
        value={form.phone}
        onChangeText={(v) => onChange('phone', v)}
        keyboardType="phone-pad"
      />
      <Text style={[s.fieldLabel, { marginTop: 16 }]}>EMAIL <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>(OPTIONAL)</Text></Text>
      <TextInput
        style={s.textInput}
        placeholder="you@example.com"
        placeholderTextColor={colors.mutedForeground}
        value={form.email}
        onChangeText={(v) => onChange('email', v)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={s.summaryBox}>
        <SummaryRow label="Device" value={`${form.brand} ${form.model}`} colors={colors} />
        <SummaryRow label="Issue" value={form.issue} colors={colors} />
      </View>
      <TouchableOpacity style={s.submitBtn} onPress={onSubmit} activeOpacity={0.8}>
        <Ionicons name="clipboard-outline" size={20} color={colors.primaryForeground} />
        <Text style={s.primaryBtnText}>CREATE REPAIR REQUEST</Text>
      </TouchableOpacity>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    headerBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoMark: {
      width: 32,
      height: 32,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: 18,
      fontWeight: '900' as const,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      letterSpacing: 2,
    },
    backBtn: {
      width: 40,
      height: 40,
      backgroundColor: colors.card,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 6,
    },
    stepDot: {
      width: 24,
      height: 4,
      backgroundColor: colors.muted,
      borderRadius: 2,
    },
    stepDotActive: {
      backgroundColor: colors.primary,
    },
    stepLabel: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
      letterSpacing: 1,
      marginLeft: 8,
    },
    scrollContent: {
      paddingHorizontal: 20,
    },
    stepBadge: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 8,
    },
    stepTitle: {
      fontSize: 36,
      fontFamily: 'Inter_900Black',
      color: colors.foreground,
      lineHeight: 40,
      marginBottom: 24,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryCard: {
      width: '47%',
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.card,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    },
    categoryIcon: {
      width: 48,
      height: 48,
      backgroundColor: colors.muted,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    categoryIconActive: {
      backgroundColor: colors.primary,
    },
    categoryLabel: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      letterSpacing: 0.5,
    },
    categoryDesc: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    brandGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    brandChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    brandChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    brandChipText: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
    },
    brandChipTextActive: {
      color: colors.primaryForeground,
    },
    fieldLabel: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
    },
    issueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    issueRowActive: {
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
    issueCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    issueCheckActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    issueText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 24,
    },
    primaryBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: colors.primaryForeground,
      letterSpacing: 1.5,
    },
    successScroll: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    successCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 28,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    successIcon: {
      width: 72,
      height: 72,
      backgroundColor: colors.primary,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    successBadge: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 8,
    },
    successTitle: {
      fontSize: 28,
      fontFamily: 'Inter_900Black',
      color: colors.foreground,
      marginBottom: 20,
    },
    ticketBox: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 28,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
    },
    ticketLabel: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    ticketNumber: {
      fontSize: 30,
      fontFamily: 'Inter_900Black',
      color: colors.primary,
      letterSpacing: 3,
    },
    successDesc: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    summaryBox: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryLabel: {
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
    },
    summaryValue: {
      fontSize: 12,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      maxWidth: '60%',
      textAlign: 'right',
    },
  });
}
