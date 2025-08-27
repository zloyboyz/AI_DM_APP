import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Sword, Globe, Dices, MessageCircle, User, Map, House } from 'lucide-react-native';
import { useAudioManager } from '../lib/hooks/useAudioManager';
import { SessionIdModal } from '../lib/components/SessionIdModal';
import { useSessionId } from '../lib/useSessionId';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { playClickSound, startInitialBackgroundMusic } = useAudioManager();
  const { sessionId, setSessionId } = useSessionId();
  const [sessionModalVisible, setSessionModalVisible] = useState(false);

  const handleBeginAdventure = () => {
    playClickSound();
    startInitialBackgroundMusic();
    router.push('/(tabs)');
  };

  const handleSetSessionId = () => {
    playClickSound();
    setSessionModalVisible(true);
  };

  const handleSessionIdConfirm = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  return (
    <LinearGradient
      colors={['#0f0727', '#1a0b2e', '#2d1b4e']}
      style={styles.container}>
      <View style={styles.content}>
        {/* Floating magical elements */}
        <View style={styles.floatingElements}>
          <View style={[styles.sparkle, { top: 100, left: 50 }]}>
            <Sparkles size={16} color="#fbbf24" />
          </View>
          <View style={[styles.sparkle, { top: 150, right: 60 }]}>
            <Sparkles size={12} color="#8b5cf6" />
          </View>
          <View style={[styles.sparkle, { bottom: 200, left: 30 }]}>
            <Sparkles size={14} color="#06b6d4" />
          </View>
        </View>

        {/* Main icon */}
        <View style={styles.mainIcon}>
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            style={styles.iconCircle}>
            <Sword size={48} color="#ffffff" />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome,</Text>
        <Text style={styles.subtitle}>Adventurer</Text>

        {/* Description */}
        <Text style={styles.description}>
          Your AI Dungeon Master awaits to guide you through epic tales of magic, mystery, and adventure.
        </Text>

        {/* Features preview */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Sword size={20} color="#8b5cf6" />
            <Text style={styles.featureText}>Create your character</Text>
          </View>
          <View style={styles.featureItem}>
            <Globe size={20} color="#8b5cf6" />
            <Text style={styles.featureText}>Explore vast worlds</Text>
          </View>
          <View style={styles.featureItem}>
            <Dices size={20} color="#8b5cf6" />
            <Text style={styles.featureText}>Roll for destiny</Text>
          </View>
        </View>

        {/* Quick access cards */}
        <View style={styles.quickAccessContainer}>
          <View style={styles.quickAccessCard}>
            <View style={styles.quickAccessIcon}>
              <MessageCircle size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.quickAccessTitle}>Chat with your AI DM</Text>
          </View>
          <View style={styles.quickAccessCard}>
            <View style={styles.quickAccessIcon}>
              <House size={24} color="#06b6d4" />
            </View>
            <Text style={styles.quickAccessTitle}>Manage your character</Text>
          </View>
          <View style={styles.quickAccessCard}>
            <View style={styles.quickAccessIcon}>
              <User size={24} color="#06b6d4" />
            </View>
            <Pressable onPress={handleSetSessionId}>
              <Text style={styles.quickAccessTitle}>Set Session ID</Text>
              {sessionId && (
                <Text style={styles.sessionIdBadge}>
                  {sessionId.length > 8 ? `${sessionId.substring(0, 8)}...` : sessionId}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* CTA Button */}
        <Pressable onPress={handleBeginAdventure} style={styles.ctaButton}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.ctaGradient}>
            <Text style={styles.ctaText}>
              {sessionId ? '🔮 Continue Your Adventure' : '🔮 Begin Your Adventure'}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.footerText}>
          Ready to embark on an unforgettable journey?
        </Text>

        {/* Session ID Modal */}
        <SessionIdModal
          isOpen={sessionModalVisible}
          onClose={() => setSessionModalVisible(false)}
          onConfirm={handleSessionIdConfirm}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    opacity: 0.7,
  },
  mainIcon: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  quickAccessCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: width * 0.28,
    minHeight: 80,
  },
  quickAccessIcon: {
    marginBottom: 8,
  },
  quickAccessTitle: {
    fontSize: 11,
    color: '#e2e8f0',
    textAlign: 'center',
    fontWeight: '600',
  },
  ctaButton: {
    marginBottom: 24,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaGradient: {
    paddingHorizontal: 48,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  sessionIdBadge: {
    fontSize: 10,
    color: '#06b6d4',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
});