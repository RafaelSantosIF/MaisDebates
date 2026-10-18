import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Canvas, Circle, RoundedRect } from '@shopify/react-native-skia';
import { colors } from '@/shared/theme/tokens';

export function ConversationArt() {
  const [staticMode, setStaticMode] = useState(Platform.OS === 'web');
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setStaticMode).catch(() => setStaticMode(true)); }, []);
  if (staticMode) return <View accessibilityLabel="Dois balões de conversa" style={styles.box}>
    <View style={[styles.bubble, styles.first]}><View style={styles.line} /><View style={[styles.line, { width: 54 }]} /></View>
    <View style={[styles.bubble, styles.second]}><View style={[styles.line, styles.lightLine]} /><View style={[styles.line, styles.lightLine, { width: 50 }]} /></View>
  </View>;
  return <View accessibilityLabel="Dois balões de conversa" style={styles.box}>
    <Canvas style={styles.canvas}>
      <Circle cx={320} cy={4} r={86} color="#DCE8FA" />
      <Circle cx={10} cy={165} r={44} color="#DCE8FA" />
      <RoundedRect x={48} y={32} width={130} height={78} r={17} color={colors.white} />
      <RoundedRect x={70} y={56} width={82} height={5} r={3} color="#C1D0E8" />
      <RoundedRect x={70} y={70} width={55} height={5} r={3} color="#C1D0E8" />
      <RoundedRect x={170} y={65} width={130} height={78} r={17} color={colors.blue} />
      <RoundedRect x={194} y={90} width={80} height={5} r={3} color="#91B1E5" />
      <RoundedRect x={194} y={104} width={52} height={5} r={3} color="#91B1E5" />
    </Canvas>
  </View>;
}

const styles = StyleSheet.create({
  box: { height: 166, backgroundColor: colors.pale, borderRadius: 18, overflow: 'hidden', marginTop: 8, marginBottom: 26 },
  canvas: { width: '100%', height: 166 },
  bubble: { position: 'absolute', width: 130, height: 78, borderRadius: 17, padding: 22, gap: 9 },
  first: { left: 48, top: 32, backgroundColor: colors.white },
  second: { left: 170, top: 65, backgroundColor: colors.blue },
  line: { height: 5, width: 82, borderRadius: 3, backgroundColor: '#C1D0E8' },
  lightLine: { backgroundColor: '#91B1E5' },
});
