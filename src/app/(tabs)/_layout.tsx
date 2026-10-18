import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/shared/theme/tokens';

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#718094', tabBarStyle: { height: 72, backgroundColor: colors.white, borderTopColor: '#E5EAF1' }, tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 5 } }}>
    <Tabs.Screen name="debates" options={{ title: 'Debates', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>▤</Text> }} />
    <Tabs.Screen name="atividade" options={{ title: 'Minha atividade', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>☷</Text> }} />
    <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>◯</Text> }} />
  </Tabs>;
}
