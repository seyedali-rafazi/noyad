import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemePreference } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { AppHeader } from '../../shared/components/AppHeader';
import { Card } from '../../shared/components/Card';
import { TextInputField } from '../../shared/components/TextInputField';
import { Button } from '../../shared/components/Button';
import { ToggleSwitch } from '../../shared/components/ToggleSwitch';
import {
  DEFAULT_TIMEZONE,
  toPersianDigits,
  useCalendarSettingsStore,
  type WeekStartOption,
} from '../../core/calendar';
import { useAiSettingsStore } from '../../core/ai/aiSettingsStore';
import { useScreenModalAnimation } from '../../shared/hooks';
import { useNotificationStore } from '../../core/notifications/notificationStore';
import { syncAllTaskReminders } from '../../core/notifications/scheduler';
import { usePlannerStore } from '../planner/plannerStore';

export const SettingsScreen: React.FC = () => {
  const { handleClose: handleBack, animatedStyle } = useScreenModalAnimation();
  const { colors, radii, spacing, typography, themePreference, setThemePreference, isDark } =
    useTheme();

  const weekStart = useCalendarSettingsStore(s => s.weekStart);
  const setWeekStart = useCalendarSettingsStore(s => s.setWeekStart);

  // Notification Store state & actions
  const taskReminders = useNotificationStore(s => s.taskRemindersEnabled);
  const setTaskRemindersEnabled = useNotificationStore(s => s.setTaskRemindersEnabled);
  const dailyBriefing = useNotificationStore(s => s.dailyBriefingEnabled);
  const setDailyBriefingEnabled = useNotificationStore(s => s.setDailyBriefingEnabled);
  const dailyBriefingHour = useNotificationStore(s => s.dailyBriefingHour);
  const dailyBriefingMinute = useNotificationStore(s => s.dailyBriefingMinute);
  const setDailyBriefingTime = useNotificationStore(s => s.setDailyBriefingTime);
  const defaultReminderOffset = useNotificationStore(s => s.defaultReminderOffsetMinutes);
  const setDefaultReminderOffset = useNotificationStore(s => s.setDefaultReminderOffsetMinutes);
  const permissionStatus = useNotificationStore(s => s.permissionStatus);
  const requestPermissions = useNotificationStore(s => s.requestPermissions);
  const sendTestNotification = useNotificationStore(s => s.sendTestNotification);
  const isSendingTest = useNotificationStore(s => s.isSendingTest);
  const [notificationTestFeedback, setNotificationTestFeedback] = useState<string | null>(null);

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

  const weekStartOptions: { key: WeekStartOption; label: string }[] = [
    { key: 'saturday', label: 'شنبه (پیش‌فرض ایران)' },
    { key: 'sunday', label: 'یک‌شنبه' },
    { key: 'monday', label: 'دوشنبه' },
  ];

  const briefingTimePresets = [
    { label: '۰۷:۰۰', hour: 7, minute: 0 },
    { label: '۰۷:۳۰', hour: 7, minute: 30 },
    { label: '۰۸:۰۰', hour: 8, minute: 0 },
    { label: '۰۸:۳۰', hour: 8, minute: 30 },
    { label: '۰۹:۰۰', hour: 9, minute: 0 },
    { label: '۱۰:۰۰', hour: 10, minute: 0 },
  ];

  const formattedBriefingTime = toPersianDigits(
    `${String(dailyBriefingHour).padStart(2, '0')}:${String(dailyBriefingMinute).padStart(2, '0')}`
  );

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
              <Pressable
                onPress={() => setIsSecure(!isSecure)}
                style={styles.eyeToggle}
                hitSlop={8}
              >
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
                {
                  color: colors.textPrimary,
                  textAlign: 'right',
                  marginBottom: 8,
                  fontWeight: '600',
                },
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
                    onPress={() => setWeekStart(opt.key)}
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
            {/* Permission Banner if not granted */}
            {permissionStatus !== 'granted' && (
              <View
                style={{
                  backgroundColor: colors.warningSubtle,
                  borderRadius: radii.sm,
                  padding: spacing.sm,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.warning,
                }}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="notifications-circle-outline" size={20} color={colors.warning} />
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.warning, fontWeight: '700', textAlign: 'right' },
                    ]}
                  >
                    دسترسی اعلان‌ها هنوز فعال نشده است
                  </Text>
                </View>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, textAlign: 'right', marginTop: 4, lineHeight: 18 },
                  ]}
                >
                  برای دریافت یادآور تسک‌ها و خلاصه صبحگاهی، لطفاً مجوز اعلان را فعال نمایید.
                </Text>
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="درخواست دسترسی اعلان"
                    onPress={requestPermissions}
                    variant="outline"
                    size="sm"
                    icon={<Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />}
                  />
                </View>
              </View>
            )}

            <View style={styles.switchRow}>
              <ToggleSwitch
                value={dailyBriefing}
                onValueChange={(val) => setDailyBriefingEnabled(val)}
              />
              <View style={styles.switchTextCol}>
                <Text
                  style={[typography.bodyMedium, { color: colors.textPrimary, textAlign: 'right' }]}
                >
                  خلاصه برنامه صبحگاهی
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textSecondary, textAlign: 'right' }]}
                >
                  ارسال اعلان مرور کارهای روزانه در ساعت {formattedBriefingTime}
                </Text>
              </View>
            </View>

            {/* Daily Briefing Time Selector */}
            {dailyBriefing && (
              <View
                style={{
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? colors.border : colors.borderLight,
                }}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.textPrimary, fontWeight: '600', textAlign: 'right', marginBottom: 8 },
                  ]}
                >
                  ساعت ارسال خلاصه صبحگاهی:
                </Text>
                <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
                  {briefingTimePresets.map((preset) => {
                    const isSelected =
                      dailyBriefingHour === preset.hour && dailyBriefingMinute === preset.minute;
                    return (
                      <Pressable
                        key={preset.label}
                        onPress={() => setDailyBriefingTime(preset.hour, preset.minute)}
                        style={{
                          backgroundColor: isSelected ? colors.accent : colors.surfaceRaised,
                          borderColor: isSelected
                            ? colors.accent
                            : isDark
                            ? colors.border
                            : colors.borderLight,
                          borderWidth: 1,
                          borderRadius: radii.full,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}
                      >
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

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
              <ToggleSwitch
                value={taskReminders}
                onValueChange={async (val) => {
                  await setTaskRemindersEnabled(val);
                  const tasks = usePlannerStore.getState().tasks;
                  await syncAllTaskReminders(tasks, val, defaultReminderOffset);
                }}
              />
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

            {/* Default Reminder Offset Selector */}
            {taskReminders && (
              <View
                style={{
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? colors.border : colors.borderLight,
                }}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.textPrimary, fontWeight: '600', textAlign: 'right', marginBottom: 8 },
                  ]}
                >
                  زمان پیش‌فرض هشدار تسک:
                </Text>
                <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: 'در زمان سررسید', value: 0 },
                    { label: '۱۰ دقیقه قبل', value: 10 },
                    { label: '۳۰ دقیقه قبل', value: 30 },
                    { label: '۱ ساعت قبل', value: 60 },
                  ].map((preset) => {
                    const isSelected = defaultReminderOffset === preset.value;
                    return (
                      <Pressable
                        key={preset.value}
                        onPress={() => setDefaultReminderOffset(preset.value)}
                        style={{
                          backgroundColor: isSelected ? colors.accent : colors.surfaceRaised,
                          borderColor: isSelected
                            ? colors.accent
                            : isDark
                            ? colors.border
                            : colors.borderLight,
                          borderWidth: 1,
                          borderRadius: radii.full,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}
                      >
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Test Notification Button */}
            <View
              style={{
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.border : colors.borderLight,
              }}
            >
              <Button
                title={isSendingTest ? 'در حال ارسال اعلان...' : 'آزمون ارسال اعلان محلی'}
                onPress={async () => {
                  const success = await sendTestNotification();
                  if (success) {
                    setNotificationTestFeedback('اعلان آزمایشی ارسال شد!');
                  } else {
                    setNotificationTestFeedback('ارسال اعلان با خطا مواجه شد. لطفاً دسترسی‌ها را بررسی فرمایید.');
                  }
                  setTimeout(() => setNotificationTestFeedback(null), 3500);
                }}
                variant="outline"
                size="sm"
                icon={<Ionicons name="paper-plane-outline" size={16} color={colors.accent} />}
              />
              {notificationTestFeedback && (
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.success,
                      fontWeight: '600',
                      textAlign: 'center',
                      marginTop: 6,
                    },
                  ]}
                >
                  {notificationTestFeedback}
                </Text>
              )}
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
              padding: spacing.lg,
              borderColor: colors.border,
              marginBottom: spacing.xxl,
              alignItems: 'center',
            }}
          >
            <Image
              source={require('../../../assets/noyad-mark.png')}
              style={{ width: 68, height: 68, borderRadius: 18, marginBottom: spacing.sm }}
              resizeMode="contain"
            />
            <Text
              style={[
                typography.bodyLarge,
                { color: colors.textPrimary, fontWeight: '700', marginBottom: 2 },
              ]}
            >
              نویاد (Noyad)
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
              ]}
            >
              دستیار و برنامه‌ریز هوشمند • نسخه ۱.۰.۰
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
