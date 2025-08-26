import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

interface VolumeSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const SLIDER_WIDTH = 120;
const THUMB_SIZE = 20;

export function VolumeSlider({ 
  value, 
  onValueChange, 
  onInteractionStart, 
  onInteractionEnd 
}: VolumeSliderProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        onInteractionStart?.();
        
        // Calculate position from touch
        const touchX = evt.nativeEvent.locationX;
        const newValue = Math.max(0, Math.min(100, (touchX / SLIDER_WIDTH) * 100));
        
        animatedValue.setValue(newValue);
        onValueChange(Math.round(newValue));
      },
      
      onPanResponderMove: (evt) => {
        if (!isDragging.current) return;
        
        const touchX = evt.nativeEvent.locationX;
        const newValue = Math.max(0, Math.min(100, (touchX / SLIDER_WIDTH) * 100));
        
        animatedValue.setValue(newValue);
        onValueChange(Math.round(newValue));
      },
      
      onPanResponderRelease: () => {
        isDragging.current = false;
        onInteractionEnd?.();
      },
    })
  ).current;

  // Update animated value when prop changes (but not during dragging)
  React.useEffect(() => {
    if (!isDragging.current) {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  }, [value]);

  const thumbPosition = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0, SLIDER_WIDTH - THUMB_SIZE],
    extrapolate: 'clamp',
  });

  const fillWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer} {...panResponder.panHandlers}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: fillWidth }]} />
        </View>
        <Animated.View 
          style={[
            styles.thumb, 
            { 
              transform: [{ translateX: thumbPosition }],
              ...(Platform.OS === 'web' && { cursor: 'pointer' })
            }
          ]} 
        />
      </View>
      <Text style={styles.valueText}>{Math.round(value)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 160,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  valueText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
  },
});