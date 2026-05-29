import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { spacing, typography, borderRadius, Colors } from '../theme';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Slide {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  bgColor: string;
}

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { setHasCompletedOnboarding } = useAuthStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides: Slide[] = [
    {
      title: 'AI-Powered Invoices',
      subtitle: 'Draft professional quotations, invoices, and proforma estimates in seconds with Gemini AI assistance.',
      icon: 'document-text-outline',
      iconColor: colors.primary[600],
      bgColor: isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)',
    },
    {
      title: 'Custom Discounts',
      subtitle: 'Easily apply percentage or flat reductions directly to document subtotals, with automatic tax recalculations.',
      icon: 'pricetag-outline',
      iconColor: colors.secondary[600],
      bgColor: isDark ? 'rgba(13, 148, 136, 0.15)' : 'rgba(13, 148, 136, 0.08)',
    },
    {
      title: 'Track Your Revenue',
      subtitle: 'Gain instant real-time insights into your business revenue, paid document metrics, and client-specific earnings.',
      icon: 'trending-up-outline',
      iconColor: '#10B981',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
    },
  ];

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(xOffset / width);
    if (pageIndex !== activeSlide) {
      setActiveSlide(pageIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      scrollViewRef.current?.scrollTo({
        x: (activeSlide + 1) * width,
        animated: true,
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setHasCompletedOnboarding(true);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setHasCompletedOnboarding(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Top Header/Skip */}
      <View style={styles.header}>
        {activeSlide < slides.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ height: 40 }} />
        )}
      </View>

      {/* Pages Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: slide.bgColor }]}>
              <Ionicons name={slide.icon as any} size={80} color={slide.iconColor} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Footer Actions */}
      <View style={styles.footer}>
        {/* Page Dots Indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeSlide === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={activeSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          gradient
          fullWidth
          size="lg"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[6],
  },
  skipButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  skipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    paddingHorizontal: spacing[2],
  },
  footer: {
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[10],
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[8],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: isDark ? colors.gray[700] : colors.gray[200],
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary[600],
  },
  button: {
    width: '100%',
  },
});
