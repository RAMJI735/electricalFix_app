import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton placeholder for Product/Service cards
 */
export function ProductCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Skeleton width={70} height={18} borderRadius={4} />
        <Skeleton width={45} height={18} borderRadius={10} />
      </View>

      {/* Brand & Name */}
      <Skeleton width={90} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
      <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 14 }} />

      {/* Spec details */}
      <Skeleton width="75%" height={12} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Card Bottom: Price and Add button */}
      <View style={styles.cardBottom}>
        <View style={{ gap: 4 }}>
          <Skeleton width={80} height={20} borderRadius={4} />
          <Skeleton width={60} height={10} borderRadius={4} />
        </View>
        <Skeleton width={95} height={34} borderRadius={8} />
      </View>
    </View>
  );
}

/**
 * Skeleton placeholder for horizontal Category pills
 */
export function CategoryPillSkeleton() {
  return (
    <View style={styles.pillSkeleton}>
      <Skeleton width={18} height={18} borderRadius={9} />
      <Skeleton width={65} height={14} borderRadius={4} />
    </View>
  );
}

/**
 * Skeleton placeholder for round Category icons in Home
 */
export function CategoryCircleSkeleton() {
  return (
    <View style={styles.circleSkeletonWrap}>
      <Skeleton width={54} height={54} borderRadius={14} style={{ marginBottom: 6 }} />
      <Skeleton width={50} height={12} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#cbd5e1',
  },
  cardSkeleton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
  },
  pillSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
    width: 110,
    height: 34,
  },
  circleSkeletonWrap: {
    width: 84,
    alignItems: 'center',
  },
});

export default Skeleton;
