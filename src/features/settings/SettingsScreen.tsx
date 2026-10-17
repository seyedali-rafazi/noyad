import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemePreference } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { AppHeader } from '../../shared/components/AppHeader';
import { Card } from '../../shared/components/Card';
import { TextInputField } from '../../shared/components/TextInputField';
import { Button } from '../../shared/components/Button';
import { ToggleSwitch } from '../../shared/components/ToggleSwitch';
import { DEFAULT_TIMEZONE } from '../../core/calendar';
import { useAiSettingsStore } from '../../core/ai/aiSettingsStore';
import { useScreenModalAnimation } from '../../shared/hooks';

export const SettingsScreen: React.FC = () => {
  const { handleClose: handleBack, animatedStyle } = useScreenModalAnimation();
  const { colors, radii, spacing, typography, themePreference, setThemePreference, isDark } =
    useTheme();

  const [weekStart, setWeekStart] = useState<'saturday' | 'sunday' | 'monday'>('saturday');
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);

  // Groq AI Settings state
  const keys = useAiSettingsStore(s => s.keys);
  const loadKeys = useAiSettingsStore(s => s.loadKeys);
  const addKey = useAiSettingsStore(s => s.addKey);
  const removeKey = useAiSettingsStore(s => s.removeKey);
  const resetKeyStatuses = useAiSettingsStore(s => s.resetKeyStatuses);

  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [keyInputError, setKeyInputError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleAddKey = async () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) {
      setKeyInputError('لطفاً کلید API را وارد فرمایید.');
      return;
    }

    if (trimmed.length < 10) {
      setKeyInputError('کلید گرواک معمولاً با gsk_ شروع می‌شود و طول بیشتری دارد.');
      return;
    }

    setKeyInputError(null);
    const added = await addKey(trimmed, newKeyLabel);
    if (!added) {
      setKeyInputError('این کلید قبلاً به فهرست شما افزوده شده است.');
      return;
    }

    setNewKeyInput('');
    setNewKeyLabel('');
    setActionFeedback('کلید جدید Groq با موفقیت ذخیره شد.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const hasExhaustedKey = keys.some(k => k.status === 'exhausted');

  const themeOptions: {
    key: ThemePreference;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: 'light', label: 'روشن', icon: 'sunny-outline' },
    { key: 'dark', label: 'تیره', icon: 'moon-outline' },
    { key: 'system', label: 'سیستم', icon: 'phone-portrait-outline' },
  ];

  const weekStartOptions = [
    { key: 'saturday', label: 'شنبه (پیش‌فرض ایران)' },
    { key: 'sunday', label: 'یک‌شنبه' },
    { key: 'monday', label: 'دوشنبه' },
  ];

  const maskKey = (key: string) => {
    if (key.length <= 10) return '••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
  };

  return (
    <AppScreen style={{ backgroundColor: 'transparent' }}>
      <Animated.View style={[animatedStyle, { backgroundColor: colors.background, flex: 1 }]}>
        <AppHeader title="تنظیمات" showBack onBackPress={handleBack} />

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
            {themeOptions.map(opt => {
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

        {/* Groq AI Section */}
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
          هوش مصنوعی (Groq)
        </Text>
        <Card variant="flat" style={{ padding: spacing.base }}>
          <Text
            style={[
              typography.bodySmall,
              {
                color: colors.textSecondary,
                textAlign: 'right',
                marginBottom: spacing.md,
                lineHeight: 20,
              },
            ]}
          >
            برای فعال‌سازی دستیار هوشمند، کلید API خود را وارد کنید (دریافت کلید رایگان از
            console.groq.com).
          </Text>

          {/* Input for new key */}
          <View style={styles.keyInputWrap}>
            <TextInputField
              label="کلید API جدید گرواک (Groq):"
              placeholder="مثال: gsk_..."
              value={newKeyInput}
              onChangeText={text => {
                setNewKeyInput(text);
                if (keyInputError) setKeyInputError(null);
              }}
              secureTextEntry={isSecure}
              error={keyInputError ?? undefined}
            />
            <Pressable onPress={() => setIsSecure(!isSecure)} style={styles.eyeToggle} hitSlop={8}>
              <Ionicons
                name={isSecure ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <TextInputField
            label="برچسب اختیاری برای شناسایی:"
            placeholder="مثلاً: کلید اصلی"
            value={newKeyLabel}
            onChangeText={setNewKeyLabel}
            containerStyle={{ marginTop: spacing.xs }}
          />

          <View style={{ marginTop: spacing.md }}>
            <Button
              title="افزودن کلید"
              onPress={handleAddKey}
              variant="primary"
              size="md"
              style={{ backgroundColor: colors.accent }}
              icon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
            />
          </View>

          {actionFeedback && (
            <View
              style={[
                styles.feedbackPill,
                { backgroundColor: colors.successSubtle, borderRadius: radii.sm },
              ]}
            >
              <Text style={[typography.caption, { color: colors.success, fontWeight: '600' }]}>
                {actionFeedback}
              </Text>
            </View>
          )}

          {/* List of saved keys */}
          <View style={styles.savedKeysHeader}>
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.textPrimary,
                  fontWeight: '700',
                },
              ]}
            >
              کلیدهای ثبت‌شده Groq ({keys.length}):
            </Text>
          </View>

          {keys.length === 0 ? (
            <View
              style={[
                styles.emptyKeysBox,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderRadius: radii.md,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
            >
              <Ionicons name="key-outline" size={24} color={colors.textMuted} />
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, textAlign: 'center', marginTop: 6 },
                ]}
              >
                هنوز کلیدی اضافه نشده است. کلید رایگان خود را از console.groq.com دریافت کنید.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8, marginTop: 4 }}>
              {keys.map((k, idx) => {
                const isActive = k.status === 'active';
                const isExhausted = k.status === 'exhausted';

                return (
                  <View
                    key={k.id}
                    style={[
                      styles.keyCardRow,
                      {
                        backgroundColor: colors.surfaceRaised,
                        borderRadius: radii.md,
                        borderColor: isDark ? colors.border : colors.borderLight,
                      },
                    ]}
                  >
                    {/* Left: Actions & Status */}
                    <View style={styles.keyCardActions}>
                      <Pressable
                        onPress={() => removeKey(k.id)}
                        hitSlop={8}
                        style={styles.deleteKeyBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </Pressable>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isActive
                              ? colors.successSubtle
                              : isExhausted
                                ? colors.warningSubtle
                                : colors.dangerSubtle,
                            borderRadius: radii.full,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isActive
                                ? colors.success
                                : isExhausted
                                  ? colors.warning
                                  : colors.danger,
                              fontWeight: '700',
                              fontSize: 10,
                            },
                          ]}
                        >
                          {isActive ? 'فعال' : isExhausted ? 'سهمیه پایان‌یافته' : 'نامعتبر'}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Key Info (RTL) */}
                    <View style={styles.keyCardTextCol}>
                      <Text
                        style={[
                          typography.bodySmall,
                          { color: colors.textPrimary, fontWeight: '700', textAlign: 'right' },
                        ]}
                      >
                        {k.label ? k.label : `کلید گرواک شماره ${idx + 1}`}
                      </Text>

                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
                        ]}
                      >
                        {maskKey(k.apiKey)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {hasExhaustedKey && (
            <View style={{ marginTop: spacing.md }}>
              <Button
                title="بازنشانی وضعیت همه کلیدها به فعال"
                onPress={resetKeyStatuses}
                variant="outline"
                size="sm"
                icon={<Ionicons name="refresh-outline" size={16} color={colors.accent} />}
              />
            </View>
          )}
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
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textPrimary, textAlign: 'right', marginBottom: 8, fontWeight: '600' },
            ]}
          >
            آغاز هفته در تقویم:
          </Text>
          <View style={styles.optionsList}>
            {weekStartOptions.map(opt => {
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
            <ToggleSwitch value={dailyBriefing} onValueChange={setDailyBriefing} />
            <View style={styles.switchTextCol}>
              <Text
                style={[typography.bodyMedium, { color: colors.textPrimary, textAlign: 'right' }]}
              >
                خلاصه برنامه صبحگاهی
              </Text>
              <Text
                style={[typography.caption, { color: colors.textSecondary, textAlign: 'right' }]}
              >
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
            <ToggleSwitch value={taskReminders} onValueChange={setTaskReminders} />
            <View style={styles.switchTextCol}>
              <Text
                style={[typography.bodyMedium, { color: colors.textPrimary, textAlign: 'right' }]}
              >
                یادآور سررسید تسک‌ها
              </Text>
              <Text
                style={[typography.caption, { color: colors.textSecondary, textAlign: 'right' }]}
              >
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
          اطلاعات سامانه
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
                { backgroundColor: colors.successSubtle, borderRadius: radii.full },
              ]}
            >
              <Text style={[typography.caption, { color: colors.success, fontWeight: '700' }]}>
                فعال
              </Text>
            </View>
            <Text style={[typography.titleSmall, { color: colors.textPrimary }]}>
              وضعیت ذخیره‌سازی محلی
            </Text>
          </View>

          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'right', marginTop: 8, lineHeight: 20 },
            ]}
          >
            • داده‌های تسک‌ها و یادداشت‌ها به صورت دائمی در دیتابیس محلی ذخیره می‌شوند.
            {'\n'}• تمامی محاسبات تاریخ و زمان بر مبنای تقویم جلالی انجام می‌شود.
          </Text>
        </Card>
      </ScrollView>
      </Animated.View>
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
  savedKeysHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },
  keyInputWrap: {
    position: 'relative',
  },
  eyeToggle: {
    position: 'absolute',
    left: 12,
    top: 36,
    zIndex: 1,
    padding: 4,
  },
  feedbackPill: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  emptyKeysBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyCardRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
  },
  keyCardTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  keyCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteKeyBtn: {
    padding: 4,
  },
});
