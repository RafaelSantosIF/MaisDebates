import { Tabs } from 'expo-router';
import { colors } from '@/shared/theme/tokens';
import { SkiaGlyph } from '@/shared/graphics/ConversationArt';

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#718094', tabBarStyle: { height: 72, backgroundColor: colors.white, borderTopColor: '#E5EAF1' }, tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 5 } }}>
    <Tabs.Screen name="debates" options={{ title: 'Debates', tabBarIcon: ({ color }) => <SkiaGlyph name="debates" size={22} color={typeof color === 'string' ? color : colors.blue} /> }} />
    <Tabs.Screen name="atividade" options={{ title: 'Minha atividade', tabBarIcon: ({ color }) => <SkiaGlyph name="activity" size={22} color={typeof color === 'string' ? color : colors.blue} /> }} />
    <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <SkiaGlyph name="profile" size={22} color={typeof color === 'string' ? color : colors.blue} /> }} />
  </Tabs>;
}
