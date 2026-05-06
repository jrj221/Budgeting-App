import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/app/(tabs)/settings.styles';
import { Palette } from '@/constants/colors';
import { useAppTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';
import { generateSampleTransactions } from '@/utils/sample-transactions';

export default function SettingsScreen() {
  const { scheme: current, schemes, setSchemeId } = useAppTheme();
  const { transactions, addTransactions, clearAll } = useTransactions();

  const onLoadSample = () => {
    addTransactions(generateSampleTransactions());
  };

  const onClearAll = () => {
    if (transactions.length === 0) return;
    Alert.alert(
      'Clear all transactions?',
      'This removes every transaction in the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: () => clearAll() },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: current.background }]}
      edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: current.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: current.textMuted }]}>
            Personalize how the app looks.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color scheme</Text>
          {schemes.map((scheme, i) => {
            const active = current.id === scheme.id;
            const isLast = i === schemes.length - 1;
            return (
              <Pressable
                key={scheme.id}
                onPress={() => setSchemeId(scheme.id)}
                style={[styles.schemeRow, isLast && styles.schemeRowLast]}>
                <View style={styles.schemeLeft}>
                  <View style={styles.swatchGroup}>
                    <View style={[styles.swatch, { backgroundColor: scheme.background }]} />
                    <View style={[styles.swatch, { backgroundColor: scheme.text }]} />
                    <View style={[styles.swatch, { backgroundColor: scheme.lineChart }]} />
                  </View>
                  <Text style={styles.schemeName}>{scheme.name}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={Palette.brand} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test data</Text>
          <Text style={styles.sectionSubtitle}>
            Drop in a varied set of past + future transactions so you don&apos;t have to retype
            them every reload.
          </Text>
          <Pressable onPress={onLoadSample} style={styles.actionRow}>
            <Ionicons name="sparkles-outline" size={20} color={Palette.brand} />
            <Text style={styles.actionText}>Load sample transactions</Text>
            <Text style={styles.actionMeta}>+30+ entries</Text>
          </Pressable>
          <Pressable
            onPress={onClearAll}
            style={[styles.actionRow, styles.actionRowLast]}
            disabled={transactions.length === 0}>
            <Ionicons name="trash-outline" size={20} color={Palette.spent} />
            <Text style={[styles.actionText, { color: Palette.spent }]}>
              Clear all transactions
            </Text>
            <Text style={styles.actionMeta}>{transactions.length} stored</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
