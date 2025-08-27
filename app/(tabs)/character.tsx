import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard as Edit3, Plus, Heart, Shield, Zap, House } from 'lucide-react-native';
import { useAudioManager } from '../../lib/hooks/useAudioManager';

interface CharacterData {
  name: string;
  race: string;
  class: string;
  level: number;
  hp: { current: number; max: number };
  ac: number;
  speed: number;
  abilities: {
    [key: string]: { score: number; modifier: number };
  };
  skills: { name: string; proficient: boolean }[];
  spells: { name: string; level: number }[];
  equipment: { name: string; quantity: number }[];
}

export default function CharacterScreen() {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const router = useRouter();
  const { playClickSound } = useAudioManager();
  const [character, setCharacter] = useState<CharacterData>({
    name: 'Aria Shadowbane',
    race: 'Half-Elf',
    class: 'Rogue',
    level: 5,
    hp: { current: 38, max: 45 },
    ac: 16,
    speed: 30,
    abilities: {
      Strength: { score: 12, modifier: 1 },
      Dexterity: { score: 18, modifier: 4 },
      Constitution: { score: 14, modifier: 2 },
      Intelligence: { score: 13, modifier: 1 },
      Wisdom: { score: 15, modifier: 2 },
      Charisma: { score: 16, modifier: 3 },
    },
    skills: [
      { name: 'Stealth', proficient: true },
      { name: 'Sleight of Hand', proficient: true },
      { name: 'Investigation', proficient: true },
      { name: 'Persuasion', proficient: true },
    ],
    spells: [
      { name: 'Minor Illusion', level: 0 },
      { name: 'Detect Magic', level: 1 },
      { name: 'Charm Person', level: 1 },
    ],
    equipment: [
      { name: 'Rapier', quantity: 1 },
      { name: 'Shortbow', quantity: 1 },
      { name: 'Leather Armor', quantity: 1 },
      { name: 'Thieves\' Tools', quantity: 1 },
      { name: '50 gold pieces', quantity: 1 },
    ],
  });

  const AbilityScore = ({ name, ability }: { name: string; ability: { score: number; modifier: number } }) => (
    <View style={styles.abilityCard}>
      <Text style={styles.abilityName}>{name}</Text>
      <Text style={styles.abilityScore}>{ability.score}</Text>
      <Text style={styles.abilityModifier}>
        {ability.modifier >= 0 ? '+' : ''}{ability.modifier}
      </Text>
    </View>
  );

  const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
    <View style={[styles.statCard, { borderColor: color }]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.characterName}>{character.name}</Text>
            <Text style={styles.characterDetails}>
              Level {character.level} {character.race} {character.class}
            </Text>
          </View>
          <Pressable onPress={() => {
            playClickSound();
            setEditModalVisible(true);
          }} style={styles.editButton}>
            <Edit3 size={20} color="#8b5cf6" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Core Stats */}
        <View style={styles.coreStatsContainer}>
          <StatCard
            icon={<Heart size={20} color="#ef4444" />}
            label="HP"
            value={`${character.hp.current}/${character.hp.max}`}
            color="#ef4444"
          />
          <StatCard
            icon={<Shield size={20} color="#06b6d4" />}
            label="AC"
            value={character.ac.toString()}
            color="#06b6d4"
          />
          <StatCard
            icon={<Zap size={20} color="#f59e0b" />}
            label="Speed"
            value={`${character.speed} ft`}
            color="#f59e0b"
          />
        </View>

        {/* Ability Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Ability Scores</Text>
          <View style={styles.abilitiesGrid}>
            {Object.entries(character.abilities).map(([name, ability]) => (
              <AbilityScore key={name} name={name} ability={ability} />
            ))}
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Pressable style={styles.addButton} onPress={playClickSound}>
              <Plus size={16} color="#8b5cf6" />
            </Pressable>
          </View>
          <View style={styles.skillsContainer}>
            {character.skills.map((skill, index) => (
              <View key={index} style={styles.skillItem}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.proficientBadge}>Proficient</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Spells */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spells</Text>
            <Pressable style={styles.addButton} onPress={playClickSound}>
              <Plus size={16} color="#8b5cf6" />
            </Pressable>
          </View>
          <View style={styles.spellsContainer}>
            {character.spells.map((spell, index) => (
              <View key={index} style={styles.spellItem}>
                <Text style={styles.spellName}>{spell.name}</Text>
                <Text style={styles.spellLevel}>Cantrip • Illusion</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <Pressable style={styles.addButton} onPress={playClickSound}>
              <Plus size={16} color="#8b5cf6" />
            </Pressable>
          </View>
          <View style={styles.equipmentContainer}>
            {character.equipment.map((item, index) => (
              <View key={index} style={styles.equipmentItem}>
                <Text style={styles.equipmentName}>{item.name}</Text>
                <Text style={styles.equipmentQuantity}>{item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}>
        <LinearGradient colors={['#0f0727', '#1a0b2e']} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Character</Text>
            <Pressable onPress={() => {
              playClickSound();
              setEditModalVisible(false);
            }}>
              <Text style={styles.modalCloseButton}>Done</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Character Name</Text>
              <TextInput
                style={styles.editInput}
                value={character.name}
                onChangeText={(text) => setCharacter(prev => ({ ...prev, name: text }))}
              />
            </View>
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Race</Text>
              <TextInput
                style={styles.editInput}
                value={character.race}
                onChangeText={(text) => setCharacter(prev => ({ ...prev, race: text }))}
              />
            </View>
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Class</Text>
              <TextInput
                style={styles.editInput}
                value={character.class}
                onChangeText={(text) => setCharacter(prev => ({ ...prev, class: text }))}
              />
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  characterDetails: {
    fontSize: 14,
    color: '#8b5cf6',
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  coreStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  abilityCard: {
    width: '30%',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
  },
  abilityName: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  abilityScore: {
    fontSize: 20,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  abilityModifier: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  skillsContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  skillName: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  proficientBadge: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  spellsContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  spellItem: {
    paddingVertical: 8,
  },
  spellName: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  spellLevel: {
    fontSize: 12,
    color: '#8b5cf6',
    marginTop: 2,
  },
  equipmentContainer: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  equipmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  equipmentName: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  equipmentQuantity: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomColor: 'rgba(139, 92, 246, 0.3)',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#e2e8f0',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
  },
});