import { useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddTransactionCard, AddTransactionCardSectionRefs } from "@/components/add-transaction-card";
import { HelpButton } from "@/components/help-button";
import { useAppTheme } from "@/contexts/theme-context";
import { useTransactions } from "@/contexts/transactions-context";
import { styles } from "@/styles/index.styles";

const ADD_HELP_STEPS = [
	{ title: "Spent or Earned", body: "Toggle between Spent (an expense) and Earned (income) before logging." },
	{ title: "Amount", body: "Tap the amount area and type the dollar value. No decimal needed — the last two digits are always cents, so 1250 = $12.50." },
	{ title: "Title", body: "Give the transaction a name. You can leave it blank if you have the 'Require name' preference turned off in Settings." },
	{ title: "Date", body: "Defaults to today. Tap to pick a past or future date — future-dated transactions appear in the Upcoming tab in History." },
	{ title: "Category", body: "Assign a category so the Home screen can group and chart your spending. Tap + to create a new one." },
	{ title: "Repeat", body: "Turn this on to log recurring transactions. Choose a frequency and end condition and the app creates the whole series at once." },
	{ title: "Log It / Earn It", body: "Tap to save. The transaction is immediately reflected in your balance and charts on the Home screen." },
];

export default function AddScreen() {
	const { addTransactions } = useTransactions();
	const { scheme } = useAppTheme();

	const scrollRef = useRef<ScrollView>(null);

	const modeToggleRef = useRef<View>(null);
	const amountRef = useRef<View>(null);
	const titleRef = useRef<View>(null);
	const dateRef = useRef<View>(null);
	const categoryRef = useRef<View>(null);
	const repeatRef = useRef<View>(null);
	const submitRef = useRef<View>(null);

	const sectionRefs: AddTransactionCardSectionRefs = {
		modeToggle: modeToggleRef,
		amount: amountRef,
		title: titleRef,
		date: dateRef,
		category: categoryRef,
		repeat: repeatRef,
		submit: submitRef,
	};

	// One ref per step, matching ADD_HELP_STEPS order.
	const stepTargets = [
		modeToggleRef,
		amountRef,
		titleRef,
		dateRef,
		categoryRef,
		repeatRef,
		submitRef,
	];

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: scheme.background }]} edges={["top"]}>
			<ScrollView
				ref={scrollRef}
				contentContainerStyle={styles.scroll}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
						<View style={{ flex: 1 }}>
							<Text style={[styles.title, { color: scheme.text }]}>Add Transaction</Text>
							<Text style={[styles.subtitle, { color: scheme.textMuted }]}>Track what you spent or earned.</Text>
						</View>
						<HelpButton steps={ADD_HELP_STEPS} stepTargets={stepTargets} scrollRef={scrollRef} />
					</View>
				</View>
				<AddTransactionCard onSubmit={addTransactions} sectionRefs={sectionRefs} />
			</ScrollView>
		</SafeAreaView>
	);
}
