import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { House, Sword, Trees, Crown, Layers, Search } from 'lucide-react-native';
import { useAudioManager } from '../../lib/hooks/useAudioManager';

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const router = useRouter();
  const { playClickSound } = useAudioManager();

  const legendItems = [
    { icon: House, label: 'Towns', color: '#f59e0b', key: 'towns' },
    { icon: Sword, label: 'Dungeons', color: '#ef4444', key: 'dungeons' },
    { icon: Trees, label: 'Wilderness', color: '#22c55e', key: 'wilderness' },
    { icon: Crown, label: 'Boss', color: '#8b5cf6', key: 'boss' },
  ];

  const handleFilterToggle = (key: string) => {
    setSelectedFilter(selectedFilter === key ? null : key);
  };

  const handleGoHome = () => {
    playClickSound();
    router.push('../');
  };

  return (
    <LinearGradient colors={['#0f0727', '#1a0b2e']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleGoHome} style={styles.homeButton}>
          <House size={20} color="#8b5cf6" />
        </Pressable>
        <Text style={styles.headerTitle}>Adventure Map</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Layers size={20} color="#8b5cf6" />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Search size={20} color="#8b5cf6" />
          </Pressable>
        </View>
      </View>

      {/* Map Legend */}
      <View style={styles.legendContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legend}>
          {legendItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = selectedFilter === item.key;
            
            return (
              <Pressable
                key={item.key}
                style={[
                  styles.legendItem,
                  isSelected && styles.legendItemSelected,
                ]}
                onPress={() => handleFilterToggle(item.key)}>
                <IconComponent size={16} color={item.color} />
                <Text style={[
                  styles.legendText,
                  { color: item.color },
                  isSelected && styles.legendTextSelected,
                ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <ScrollView
          style={styles.mapScrollView}
          contentContainerStyle={styles.mapContent}
          maximumZoomScale={3}
          minimumZoomScale={0.5}
          bouncesZoom={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}>
          
          {/* Placeholder map background */}
          <View style={styles.mapBackground}>
            <LinearGradient
              colors={['rgba(45, 27, 78, 0.9)', 'rgba(15, 7, 39, 0.7)']}
              style={styles.mapOverlay}>
              
              {/* Sample location markers */}
              <View style={[styles.locationMarker, styles.townMarker, { top: 120, left: 80 }]}>
                <House size={20} color="#f59e0b" />
              </View>
              
              <View style={[styles.locationMarker, styles.dungeonMarker, { top: 200, right: 100 }]}>
                <Sword size={20} color="#ef4444" />
              </View>
              
              <View style={[styles.locationMarker, styles.wildernessMarker, { bottom: 150, left: 60 }]}>
                <Trees size={20} color="#22c55e" />
              </View>
              
              <View style={[styles.locationMarker, styles.bossMarker, { top: 300, left: 200 }]}>
                <Crown size={20} color="#8b5cf6" />
              </View>

              {/* Central placeholder text */}
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderTitle}>Adventure Awaits</Text>
                <Text style={styles.mapPlaceholderText}>
                  Your journey will be mapped here as you explore the world
                </Text>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>

      {/* Map Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoPanelTitle}>Current Location</Text>
        <Text style={styles.infoPanelText}>Mysterious Dungeon Entrance</Text>
        <Text style={styles.infoPanelDescription}>
          An ancient stone archway glowing with mystical runes
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomColor: 'rgba(139, 92, 246, 0.3)',
    borderBottomWidth: 1,
    position: 'relative',
  },
  homeButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    paddingVertical: 16,
  },
  legend: {
    paddingHorizontal: 24,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  legendItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendTextSelected: {
    color: '#e2e8f0',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
  },
  mapScrollView: {
    flex: 1,
  },
  mapContent: {
    minHeight: '100%',
    minWidth: '100%',
  },
  mapBackground: {
    flex: 1,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
  },
  mapOverlay: {
    flex: 1,
    position: 'relative',
  },
  locationMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  townMarker: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
  },
  dungeonMarker: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  wildernessMarker: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  bossMarker: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8b5cf6',
  },
  mapPlaceholder: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -40 }],
    width: 200,
    alignItems: 'center',
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoPanel: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
  },
  infoPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  infoPanelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  infoPanelDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
});