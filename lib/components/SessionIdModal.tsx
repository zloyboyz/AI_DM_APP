import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';

interface SessionIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string) => void;
}

export function SessionIdModal({ isOpen, onClose, onConfirm }: SessionIdModalProps) {
  const [sessionId, setSessionId] = useState('');

  const handleConfirm = () => {
    if (sessionId.trim()) {
      onConfirm(sessionId.trim());
      setSessionId('');
      onClose();
    } else {
      Alert.alert('Error', 'Please enter a valid session ID');
    }
  };

  const handleClose = () => {
    setSessionId('');
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1e1b4b', '#312e81']}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Set Session ID</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#e2e8f0" />
              </Pressable>
            </View>

            <Text style={styles.description}>
              Enter a session ID to continue your adventure or start a new one.
            </Text>

            <TextInput
              style={styles.input}
              value={sessionId}
              onChangeText={setSessionId}
              placeholder="Enter session ID..."
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonContainer}>
              <Pressable onPress={handleClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable onPress={handleConfirm} style={styles.confirmButton}>
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  confirmGradient: {
    padding: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});