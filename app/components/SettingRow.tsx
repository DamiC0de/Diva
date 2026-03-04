/**
 * Settings Components — 2026 Design
 * Modern, aligned with Diva design system
 */
import React from 'react';
import { View, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './ui/Text';
import { useTheme } from '../constants/theme';
import { ChevronRight } from 'lucide-react-native';

interface SettingRowProps {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}

export function SettingRow({ label, value, icon, onPress, danger }: SettingRowProps) {
  const theme = useTheme();
  const textColor = danger ? theme.error : theme.text;
  
  return (
    <TouchableOpacity 
      style={[styles.row, { backgroundColor: theme.card }]} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.labelArea}>
        <Text style={{ ...styles.label, color: textColor }}>{label}</Text>
      </View>
      <View style={styles.right}>
        {value && <Text style={{ ...styles.value, color: theme.textSecondary }}>{value}</Text>}
        {onPress && <ChevronRight size={20} color={theme.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

interface SettingToggleProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  value: boolean;
  onToggle: (val: boolean) => void;
}

export function SettingToggle({ label, description, icon, value, onToggle }: SettingToggleProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.card }]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.labelArea}>
        <Text style={{ ...styles.label, color: theme.text }}>{label}</Text>
        {description && <Text style={{ ...styles.description, color: theme.textMuted }}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: theme.primary, false: theme.border }}
        thumbColor="#fff"
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

interface SettingSelectProps {
  label: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (val: string) => void;
}

export function SettingSelect({ label, options, selected, onSelect }: SettingSelectProps) {
  const theme = useTheme();
  return (
    <View style={[styles.selectContainer, { backgroundColor: theme.card }]}>
      <Text style={{ ...styles.label, color: theme.text }}>{label}</Text>
      <View style={styles.optionsRow}>
        {options.map(opt => {
          const isSelected = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option, 
                { backgroundColor: isSelected ? theme.primary : theme.bgSecondary }
              ]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={{
                ...styles.optionText,
                color: isSelected ? '#fff' : theme.textSecondary,
                fontWeight: isSelected ? '600' : '400',
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SettingSectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

export function SettingSectionHeader({ title, icon }: SettingSectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      {icon && <View style={styles.sectionIcon}>{icon}</View>}
      <Text style={{ ...styles.sectionTitle, color: theme.primary }}>{title}</Text>
    </View>
  );
}

// Group wrapper for visual grouping
export function SettingGroup({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 16,
    minHeight: 52,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelArea: { 
    flex: 1,
  },
  right: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
  },
  label: { 
    fontSize: 16,
    fontWeight: '400',
  },
  value: { 
    fontSize: 15,
  },
  description: { 
    fontSize: 13, 
    marginTop: 2,
    lineHeight: 18,
  },
  sectionHeader: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingTop: 28, 
    paddingBottom: 10,
    gap: 8,
  },
  sectionIcon: {
    opacity: 0.8,
  },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 1,
  },
  selectContainer: { 
    paddingVertical: 14, 
    paddingHorizontal: 16,
  },
  optionsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 8, 
    marginTop: 10,
  },
  option: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20,
  },
  optionText: { 
    fontSize: 14,
  },
  group: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
});
