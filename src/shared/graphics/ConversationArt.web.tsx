import { StyleSheet, View } from 'react-native';
import { colors } from '@/shared/theme/tokens';

export function ConversationArt() {
  return <View accessibilityLabel="Dois balões de conversa" style={styles.box}>
    <View style={[styles.bubble, styles.first]}><View style={styles.line} /><View style={[styles.line, styles.shortLine]} /></View>
    <View style={[styles.bubble, styles.second]}><View style={[styles.line, styles.lightLine]} /><View style={[styles.line, styles.lightLine, styles.shortLine]} /></View>
  </View>;
}

const styles = StyleSheet.create({
  box: { height: 166, backgroundColor: colors.pale, borderRadius: 18, overflow: 'hidden', marginTop: 8, marginBottom: 26 },
  bubble: { position: 'absolute', width: 130, height: 78, borderRadius: 17, padding: 22, gap: 9 },
  first: { left: 48, top: 32, backgroundColor: colors.white },
  second: { left: 170, top: 65, backgroundColor: colors.blue },
  line: { height: 5, width: 82, borderRadius: 3, backgroundColor: '#C1D0E8' },
  shortLine: { width: 54 },
  lightLine: { backgroundColor: '#91B1E5' },
});
