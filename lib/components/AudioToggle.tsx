import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useRef, useEffect } from 'react';

interface AudioToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  onPress?: () => void;
}

export function AudioToggle({ value, onValueChange, onPress }: AudioToggleProps) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    onPress?.();
    onValueChange(!value);
  };

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(55, 65, 81, 1)', 'rgba(139, 92, 246, 1)'],
  });

  const thumbTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const thumbScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View 
          style={[
            styles.thumb,
            {
              transform: [
                { translateX: thumbTranslate },
                { scale: thumbScale },
              ],
            },
          ]} 
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});