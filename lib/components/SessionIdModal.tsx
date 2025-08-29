import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { getSessionId } from '../session';

interface SessionIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string) => void;
}

export function SessionIdModal({ isOpen, onClose, onConfirm }: SessionIdModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isOpen) {
      // Prefill with current session ID when modal opens
      const loadCurrentSessionId = async () => {
        const currentSessionId = await getSessionId();
        setInputValue(currentSessionId || '');
      };
      loadCurrentSessionId();
      setError('');
      
      // Focus input after a short delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const validateSessionId = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Session ID is required');
      return false;
    }
    
    // Check allowed characters: A-Za-z0-9-_
    const validPattern = /^[A-Za-z0-9\-_]+$/;
    if (!validPattern.test(trimmed)) {
      setError('Session ID can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (validateSessionId(trimmed)) {
      onConfirm(trimmed);
      onClose();
    }
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (error) {
      // Clear error when user starts typing
      setError('');
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      aria-modal="true">
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={['#1a0b2e', '#2d1b4e']}
              style={styles.modalContent}>
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Set Session ID</Text>
                <Pressable onPress={handleCancel} style={styles.closeButton}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Input Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Session ID</Text>
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, error && styles.textInputError]}
                  value={inputValue}
                  onChangeText={handleInputChange}
                  placeholder="Enter session ID"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleConfirm}
                />
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
                <Text style={styles.helperText}>
                  Only letters, numbers, hyphens, and underscores are allowed
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <Pressable onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleConfirm} style={styles.confirmButton}>
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.confirmButtonGradient}>
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
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
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  textInputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
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
  confirmButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});