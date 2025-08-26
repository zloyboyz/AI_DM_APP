import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { MessageCircle, User, Map, Settings } from 'lucide-react-native';
import { Chrome as Home } from 'lucide-react-native';
import { useAudioManager } from '../hooks/useAudioManager';
import { Pressable, View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

function CustomTabBarButton({ children, onPress, accessibilityState, ...props }: any) {
  const { playClickSound } = useAudioManager();
  const isSelected = accessibilityState?.selected;
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.1 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [isSelected]);

  const handlePress = () => {
    playClickSound();
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.tabButton}>
      <Animated.View style={[
        styles.tabButtonContent, 
        isSelected && styles.selectedTab,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a0b2e',
          borderTopColor: '#6366f1',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarButton: CustomTabBarButton,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ size, color, focused }) => (
            <MessageCircle size={focused ? size * 1.3 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'Character',
          tabBarIcon: ({ size, color, focused }) => (
            <User size={focused ? size * 1.3 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ size, color, focused }) => (
            <Map size={focused ? size * 1.3 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color, focused }) => (
            <Settings size={focused ? size * 1.3 : size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectedTab: {
    // Optional: Add any selected state styling here
  },
});