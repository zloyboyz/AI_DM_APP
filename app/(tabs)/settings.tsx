import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Volume2, Music, VolumeX, User, Bell, Download, Upload, CircleHelp as HelpCircle, Mail, Shield, LogOut, House } from 'lucide-react-native';
import { Trash2 } from 'lucide-react-native';
import { useAudioManager } from '../../lib/hooks/useAudioManager';
import { VolumeSlider } from '../../lib/components/VolumeSlider';
import { AudioToggle } from '../../lib/components/AudioToggle';
import { useSessionId } from '../../lib/useSessionId';
import { clearChat } from '../../lib/storage';
import localforage from 'localforage';

export default function SettingsScreen() {
  const router = useRouter();
  const { audioSettings, updateAudioSettings, playClickSound } = useAudioManager();
  const { sessionId } = useSessionId();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [username, setUsername] = useState('AdventurerX');
  const [email, setEmail] = useState('adventurer@example.com');

  const handleSyncCharacterData = () => {
    playClickSound();
    Alert.alert(
      'Sync Character Data',
      'This will synchronize your character data with the external system.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sync', onPress: () => console.log('Syncing character data...') },
      ]
    );
  };

  const handleExportCharacter = () => {
    playClickSound();
    Alert.alert('Export Character', 'Character data exported successfully!');
  };

  const handleImportCharacter = () => {
    playClickSound();
    Alert.alert('Import Character', 'Select a character file to import.');
  };

  const handleDeleteTextHistory = () => {
    playClickSound();
    Alert.alert(
      'Delete Text History',
      'This will permanently delete all your chat text messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              if (sessionId) {
                await clearChat(sessionId);
                Alert.alert('Success', 'Text chat history has been deleted.');
              } else {
                Alert.alert('Error', 'No active session found.');
              }
            } catch (error) {
              console.error('Error deleting text history:', error);
              Alert.alert('Error', 'Failed to delete text history.');
            }
          }
        },
      ]
    );
  };

  const handleDeleteVoiceHistory = () => {
    playClickSound();
    Alert.alert(
      'Delete Voice History',
      'This will permanently delete all your cached voice messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Clear audio cache
              const audioDB = localforage.createInstance({ name: "aidm", storeName: "audio" });
              const metaDB = localforage.createInstance({ name: "aidm", storeName: "meta" });
              
              await audioDB.clear();
              await metaDB.clear();
              
              Alert.alert('Success', 'Voice history has been deleted.');
            } catch (error) {
              console.error('Error deleting voice history:', error);
              Alert.alert('Error', 'Failed to delete voice history.');
            }
          }
        },
      ]
    );
  };

  const handleSignOut = () => {
    playClickSound();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => console.log('Signing out...') },
      ]
    );
  };

  const handleVolumeChange = (newVolume: number) => {
    updateAudioSettings({ masterVolume: newVolume });
  };

  const handleBackgroundMusicToggle = (enabled: boolean) => {
    playClickSound();
    updateAudioSettings({ backgroundMusicEnabled: enabled });
  };

  const handleSoundEffectsToggle = (enabled: boolean) => {
    updateAudioSettings({ soundEffectsEnabled: enabled });
    // Play click sound after updating settings to demonstrate the toggle
    if (enabled) {
      setTimeout(() => playClickSound(), 100);
    }
  };

  const handleGoHome = () => {
    playClickSound();
    router.push('../');
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    rightComponent, 
    onPress,
    isDangerous = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    isDangerous?: boolean;
  }) => (
    <Pressable 
      style={styles.settingItem} 
      onPress={() => {
        playClickSound();
        onPress?.();
      }}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, isDangerous && styles.dangerousIcon]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, isDangerous && styles.dangerousText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightComponent && (
        <View style={styles.settingRight}>
          {rightComponent}
        </View>
      )}
    </Pressable>
  );


  return (
    <LinearGradient colors={['#0f0727', '#1a0b2e']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleGoHome} style={styles.homeButton}>
          <House size={20} color="#8b5cf6" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your adventure</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Audio Settings</Text>
          
          <SettingItem
            icon={<Volume2 size={20} color="#8b5cf6" />}
            title="Master Volume"
            rightComponent={
              <VolumeSlider 
                value={audioSettings.masterVolume} 
                onValueChange={handleVolumeChange}
                onInteractionStart={() => console.log('Volume interaction started')}
                onInteractionEnd={() => console.log('Volume interaction ended')}
              />
            }
          />
          
          <SettingItem
            icon={<Music size={20} color="#8b5cf6" />}
            title="Background Music"
            subtitle="Atmospheric fantasy music"
            rightComponent={
              <AudioToggle
                value={audioSettings.backgroundMusicEnabled}
                onValueChange={handleBackgroundMusicToggle}
                onPress={playClickSound}
              />
            }
          />
          
          <SettingItem
            icon={<VolumeX size={20} color="#8b5cf6" />}
            title="Sound Effects"
            subtitle="Dice rolls, spells and actions"
            rightComponent={
              <AudioToggle
                value={audioSettings.soundEffectsEnabled}
                onValueChange={handleSoundEffectsToggle}
              />
            }
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Account</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
            />
            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>Change</Text>
            </Pressable>
          </View>

          <Pressable style={styles.syncButton} onPress={handleSyncCharacterData}>
            <Text style={styles.syncButtonText}>Sync Character Data</Text>
          </Pressable>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Preferences</Text>
          
          <SettingItem
            icon={<Bell size={20} color="#8b5cf6" />}
            title="Push Notifications"
            subtitle="Get notified when it's your turn to respond"
            rightComponent={
              <AudioToggle
                value={pushNotifications}
                onValueChange={setPushNotifications}
                onPress={playClickSound}
              />
            }
          />

          <View style={styles.buttonGroup}>
            <Pressable style={styles.actionButton} onPress={handleExportCharacter}>
              <Download size={16} color="#8b5cf6" />
              <Text style={styles.actionButtonText}>Export Character</Text>
            </Pressable>
            
            <Pressable style={styles.actionButton} onPress={handleImportCharacter}>
              <Upload size={16} color="#8b5cf6" />
              <Text style={styles.actionButtonText}>Import Character</Text>
            </Pressable>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗂️ Data Management</Text>
          
          <View style={styles.buttonGroup}>
            <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteTextHistory}>
              <Trash2 size={16} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Text History</Text>
            </Pressable>
            
            <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteVoiceHistory}>
              <Trash2 size={16} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Voice History</Text>
            </Pressable>
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Help & Support</Text>
          
          <SettingItem
            icon={<HelpCircle size={20} color="#8b5cf6" />}
            title="How to Play"
            subtitle="Learn the basics of the game"
            onPress={() => Alert.alert('How to Play', 'Tutorial content would be displayed here.')}
          />
          
          <SettingItem
            icon={<Mail size={20} color="#8b5cf6" />}
            title="Contact Support"
            subtitle="Get help with any issues"
            onPress={() => Alert.alert('Contact Support', 'Support contact information would be displayed here.')}
          />
          
          <SettingItem
            icon={<Shield size={20} color="#8b5cf6" />}
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content would be displayed here.')}
          />
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <SettingItem
            icon={<LogOut size={20} color="#ef4444" />}
            title="Sign Out"
            onPress={handleSignOut}
            isDangerous={true}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
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
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8b5cf6',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerousIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  dangerousText: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#e2e8f0',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
  },
  editButton: {
    position: 'absolute',
    right: 12,
    top: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});