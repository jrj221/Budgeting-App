import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddTransactionCard } from '@/components/add-transaction-card';
import { styles } from '@/app/(tabs)/index.styles';
import { useAppTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';

export default function HomeScreen() {
  const { addTransactions } = useTransactions();
  const { scheme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: scheme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: scheme.text }]}>Add Transaction</Text>
          <Text style={[styles.subtitle, { color: scheme.textMuted }]}>
            Track what you spent or earned.
          </Text>
        </View>
        <AddTransactionCard onSubmit={addTransactions} />
      </ScrollView>
    </SafeAreaView>
  );
}
