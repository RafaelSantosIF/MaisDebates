import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { router, usePathname } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, space } from '@/shared/theme/tokens';
import { SkiaGlyph } from '@/shared/graphics/ConversationArt';
import { BrandLogo } from '@/shared/ui/BrandLogo';

export function Page({ children, footer, title, onBack }: { children: ReactNode; footer?: ReactNode; title?: string; onBack?: () => void }) {
  const pathname = usePathname();
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [pathname, title]);
  const showBack = pathname !== '/' && !['/debates', '/atividade', '/perfil'].includes(pathname);
  function back() {
    if (onBack) { onBack(); return; }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
    {title ? <View style={styles.bar}>{showBack ? <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={back} style={styles.back}><SkiaGlyph name="arrow-left" size={26} color={colors.blue} /></Pressable> : null}{title === '+Debates' ? <BrandLogo width={Math.min(showBack ? 116 : 124, windowWidth - (showBack ? 88 : 40))} /> : <Text style={styles.barTitle}>{title}</Text>}</View> : null}
    <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    {footer ? <View style={styles.footer}>{footer}</View> : null}
  </SafeAreaView>;
}

export function Kicker({ children }: { children: ReactNode }) { return <Text style={styles.kicker}>{children}</Text>; }
export function Heading({ children, large = false }: { children: ReactNode; large?: boolean }) { return <Text style={[styles.heading, large && styles.largeHeading]}>{children}</Text>; }
export function Body({ children, lead = false }: { children: ReactNode; lead?: boolean }) { return <Text style={lead ? styles.lead : styles.bodyText}>{children}</Text>; }
export function Card({ children }: { children: ReactNode }) { return <View style={styles.card}>{children}</View>; }
export function Banner({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'amber' | 'green' }) {
  return <View style={[styles.banner, tone === 'amber' && styles.bannerAmber, tone === 'green' && styles.bannerGreen]}><Text style={[styles.bannerText, tone === 'amber' && { color: colors.amber }, tone === 'green' && { color: colors.green }]}>{children}</Text></View>;
}
export function Button({ label, onPress, disabled, secondary, busy, large = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; busy?: boolean; large?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled || !!busy }} onPress={onPress} disabled={disabled || busy} style={({ pressed }) => [styles.button, large && styles.largeButton, secondary && styles.secondary, (disabled || busy) && styles.buttonDisabled, pressed && { opacity: 0.84 }]}>
    {busy ? <ActivityIndicator color={secondary ? colors.blue : colors.white} /> : <Text style={[styles.buttonText, large && styles.largeButtonText, secondary && styles.secondaryText]}>{label}</Text>}
  </Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, multiline, helper, error, secureTextEntry, keyboardType, autoCapitalize }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean; helper?: string; error?: string; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'url' | 'numeric'; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#7A8695" multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} style={[styles.input, multiline && styles.textarea, !!error && styles.inputError]} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize || 'sentences'} />
    {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  bar: { minHeight: 64, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#EDF0F5', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 20 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', marginRight: 4 },
  barTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 }, body: { padding: 20, paddingBottom: 32 },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5EAF1', paddingHorizontal: 20, paddingVertical: 14 },
  kicker: { color: colors.blue, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  heading: { color: colors.ink, fontSize: 26, lineHeight: 33, fontWeight: '700', letterSpacing: -0.6, marginBottom: 14 }, largeHeading: { fontSize: 34, lineHeight: 39, letterSpacing: -1.1 },
  lead: { color: colors.muted, fontSize: 17, lineHeight: 25, marginBottom: 14 },
  bodyText: { color: colors.muted, fontSize: 14, lineHeight: 22, marginBottom: 14 },
  card: { backgroundColor: colors.white, borderColor: '#E1E6EE', borderWidth: 1, borderRadius: radius.card, padding: 18, marginVertical: 12 },
  banner: { backgroundColor: colors.pale, borderRadius: 11, padding: 14, marginVertical: 14 },
  bannerAmber: { backgroundColor: '#FFF1DB' }, bannerGreen: { backgroundColor: colors.greenPale },
  bannerText: { color: colors.blue, fontSize: 12, lineHeight: 19 },
  button: { minHeight: 48, backgroundColor: colors.blue, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  largeButton: { minHeight: 58, borderRadius: 30 },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#C8D5E8' },
  buttonDisabled: { backgroundColor: '#DCE2EB' }, buttonText: { color: colors.white, fontSize: 14, fontWeight: '700' }, largeButtonText: { fontSize: 17 }, secondaryText: { color: colors.blue },
  field: { marginVertical: 18 }, label: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 50, color: colors.ink, backgroundColor: colors.white, borderColor: '#CDD6E3', borderWidth: 1, borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { minHeight: 126 }, inputError: { borderColor: colors.red }, helper: { color: '#6B7B8E', fontSize: 11, lineHeight: 17, marginTop: space.sm }, error: { color: colors.red, fontSize: 11, marginTop: space.sm },
});
