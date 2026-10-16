import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemePreference } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { AppHeader } from '../../shared/components/AppHeader';
import { Card } from '../../shared/components/Card';
import { DEFAULT_TIMEZONE } from '../../core/calendar';

export const SettingsScreen: React.FC = () => {
  const { colors, radii, spacing, typography, themePreference, setThemePreference, isDark } =
    useTheme();

  const [weekStart, setWeekStart] = useState<'saturday' | 'sunday' | 'monday'>('saturday');
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);

  const themeOptions: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'light', label: 'روشن', icon: 'sunny-outline' },
    { key: 'dark', label: 'تیره', icon: 'moon-outline' },
    { key: 'system', label: 'سیستم', icon: 'phone-portrait-outline' },
  ];

  const weekStartOptions = [
    { key: 'saturday', label: 'شنبه (پیش‌فرض ایران)' },
    { key: 'sunday', label: 'یک‌شنبه' },
    { key: 'monday', label: 'دوشنبه' },
  ];

  return (
    <AppScreen>
      <AppHeader title="تنظیمات" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: 60 }}
      >
        {/* Appearance Section */}
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'right',
              marginTop: spacing.base,
              marginBottom: 8,
              fontWeight: '700',
            },
          ]}
        >
          ظاهر و پوسته
        </Text>
        <Card variant="flat" style={{ padding: spacing.md }}>
          <View style={styles.themeOptionsRow}>
            {themeOptions.map((opt) => {
              const isSelected = themePreference === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setThemePreference(opt.key)}
                  style={[
                    styles.themeItem,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surfaceRaised,
                      borderRadius: radii.md,
                      paddingVertical: spacing.md - 2,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : colors.textPrimary}
                  />
                  <Text
                    style={[
                      typography.bodySmall,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                        marginTop: 4,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Calendar & Timezone Section */}
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'right',
              marginTop: spacing.lg,
              marginBottom: 8,
              fontWeight: '700',
            },
          ]}
        >
          تقویم و تاریخ
        </Text>
        <Card variant="flat" style={{ padding: spacing.md }}>
          {/* Week Start */}
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textPrimary, textAlign: 'right', marginBottom: 8, fontWeight: '600' },
            ]}
          >
            آغاز هفته در تقویم:
          </Text>
          <View style={styles.optionsList}>
            {weekStartOptions.map((opt) => {
              const isSelected = weekStart === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setWeekStart(opt.key as typeof weekStart)}
                  style={[
                    styles.radioRow,
                    {
                      backgroundColor: isSelected ? colors.surfaceRaised : 'transparent',
                      borderRadius: radii.sm,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? colors.accent : colors.textMuted}
                  />
                  <Text
                    style={[
                      typography.bodyMedium,
                      {
                        color: colors.textPrimary,
                        marginRight: 8,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.infoDivider,
              { borderTopColor: isDark ? colors.border : colors.borderLight },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {DEFAULT_TIMEZONE}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                منطقه زمانی پیش‌فرض:
              </Text>
            </View>
          </View>
        </Card>

        {/* Notifications Preference */}
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'right',
              marginTop: spacing.lg,
              marginBottom: 8,
              fontWeight: '700',
            },
          ]}
        >
          اعلان‌ها و یادآوری‌ها
        </Text>
        <Card variant="flat" style={{ padding: spacing.md }}>
          <View style={styles.switchRow}>
            <Switch
              value={dailyBriefing}
              onValueChange={setDailyBriefing}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
            <View style={styles.switchTextCol}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, textAlign: 'right' }]}>
                خلاصه برنامه صبحگاهی
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'right' }]}>
                ارسال اعلان مرور کارهای روزانه در ساعت ۸:۰۰ صبح
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.switchRow,
              {
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.border : colors.borderLight,
              },
            ]}
          >
            <Switch
              value={taskReminders}
              onValueChange={setTaskReminders}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
            <View style={styles.switchTextCol}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, textAlign: 'right' }]}>
                یادآور سررسید تسک‌ها
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'right' }]}>
                ارسال هشدار قبل از فرارسیدن موعد انجام کار
              </Text>
            </View>
          </View>
        </Card>

        {/* System & Architecture Info */}
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'right',
              marginTop: spacing.lg,
              marginBottom: 8,
              fontWeight: '700',
            },
          ]}
        >
          اطلاعات سامانه و وضعیت ادغام
        </Text>
        <Card
          variant="subtle"
          style={{
            padding: spacing.base,
            borderColor: colors.border,
            marginBottom: spacing.xxl,
          }}
        >
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: colors.warningSubtle, borderRadius: radii.full },
              ]}
            >
              <Text style={[typography.caption, { color: colors.warning, fontWeight: '700' }]}>
                پروتوتایپ محلی
              </Text>
            </View>
            <Text style={[typography.titleSmall, { color: colors.textPrimary }]}>
              وضعیت ادغام هوش مصنوعی و دیتابیس
            </Text>
          </View>

          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'right', marginTop: 8, lineHeight: 20 },
            ]}
          >
            • داده‌های این نسخه صرفاً به عنوان پروتوتایپ در حافظه محلی ذخیره می‌شوند.
            {'\n'}• اتصال سرویس هوش مصنوعی و پایگاه داده پایدار SQLite در فاز بعدی فعال خواهد شد.
            {'\n'}• تمامی تاریخ‌ها بر مبنای تقویم جلالی (date-fns-jalali) و منطقه زمانی تهران محاسبه می‌شوند.
          </Text>
        </Card>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  themeOptionsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  themeItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 4,
  },
  radioRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  infoDivider: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextCol: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
