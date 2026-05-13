import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
	Image,
	InputAccessoryView,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { formatAmountDisplay, sanitizeAmountDigits, Transaction } from "@/components/add-transaction-card.presenter";
import { BudgetEditorSheet } from "@/components/budget-editor-sheet";
import { styles } from "@/components/welcome-screen.styles";
import { Palette } from "@/constants/colors";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useAppTheme } from "@/contexts/theme-context";
import { useTour } from "@/contexts/tour-context";
import { useTransactions } from "@/contexts/transactions-context";

const ACCESSORY_ID = "welcome-balance-done";

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
	{
		icon: "add-circle-outline",
		title: "Track what you spent or earned",
		body: "Log a transaction in seconds — enter an amount, pick a category, set the date.",
	},
	{
		icon: "repeat-outline",
		title: "Schedule recurring transactions",
		body: "Rent, paychecks, subscriptions — allow yourself to see the forecast ahead.",
	},
	{
		icon: "trending-up-outline",
		title: "See where your money is going",
		body: "Charts to see your spending by category and a projected balance graph for the future.",
	},
];

export function WelcomeScreen() {
	const { addTransactions } = useTransactions();
	const { markWelcomeSeen } = useOnboarding();
	const { scheme, schemes, setSchemeId } = useAppTheme();
	const { startTour } = useTour();

	const [amountDigits, setAmountDigits] = useState("");
	const [budgetEditorOpen, setBudgetEditorOpen] = useState(false);
	const inputRef = useRef<TextInput>(null);
	const scrollRef = useRef<ScrollView>(null);

	const focusBalance = () => {
		inputRef.current?.focus();
		setTimeout(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		}, 80);
	};

	const submit = async (withTour: boolean) => {
		const cents = parseInt(amountDigits || "0", 10);
		if (cents > 0) {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(12, 0, 0, 0);
			const tx: Transaction = {
				id: `tx-starting-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
				seriesId: null,
				mode: "earned",
				amountCents: cents,
				title: "Starting balance",
				date: yesterday.toISOString(),
				categoryId: null,
			};
			addTransactions([tx]);
		}
		Keyboard.dismiss();
		await markWelcomeSeen();
		router.replace("/");
		if (withTour) {
			startTour();
		}
	};

	return (
		<SafeAreaProvider>
			<SafeAreaView style={[styles.safe, { backgroundColor: scheme.background }]} edges={["top", "bottom"]}>
				<KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<ScrollView
						ref={scrollRef}
						contentContainerStyle={styles.scroll}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.logoBubble}>
							<Image source={require("@/assets/images/app_icon.png")} style={{ width: 40, height: 40 }} />
						</View>

						<View style={{ gap: 6 }}>
							<Text style={[styles.title, { color: scheme.text }]}>Welcome to Money & Me</Text>
							<Text style={[styles.subtitle, { color: scheme.textMuted }]}>
								A quick tour to get you started.
							</Text>
						</View>

						<View style={styles.featureList}>
							{FEATURES.map((f) => (
								<View key={f.title} style={styles.featureRow}>
									<View style={styles.featureIconWrap}>
										<Ionicons name={f.icon} size={18} color={Palette.brand} />
									</View>
									<View style={styles.featureBody}>
										<Text style={[styles.featureTitle, { color: scheme.text }]}>{f.title}</Text>
										<Text style={[styles.featureSubtitle, { color: scheme.textMuted }]}>
											{f.body}
										</Text>
									</View>
								</View>
							))}
						</View>

						<View style={styles.card}>
							<Text style={styles.cardLabel}>Pick a color scheme</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.themeChipsRow}
							>
								{schemes.map((s) => {
									const active = scheme.id === s.id;
									return (
										<Pressable
											key={s.id}
											onPress={() => setSchemeId(s.id)}
											style={[styles.themeChip, active && styles.themeChipActive]}
										>
											<View style={styles.swatchTrio}>
												<View style={[styles.swatchSm, { backgroundColor: s.background }]} />
												<View style={[styles.swatchSm, { backgroundColor: s.text }]} />
												<View style={[styles.swatchSm, { backgroundColor: s.lineChart }]} />
											</View>
											<Text style={styles.themeName}>{s.name}</Text>
										</Pressable>
									);
								})}
							</ScrollView>
							<Text style={styles.cardHint}>You can change this anytime in Settings.</Text>
						</View>

						<View style={styles.card}>
							<Text style={styles.cardLabel}>Set a budget (optional)</Text>
							<Text style={styles.cardHint}>
								Pick how much you want to spend per category each week. You can also do this later from
								Overview.
							</Text>
							<Pressable style={styles.startBtnSecondary} onPress={() => setBudgetEditorOpen(true)}>
								<Ionicons name="wallet-outline" size={18} color={Palette.brand} />
								<Text style={styles.startTextSecondary}>Open budget editor</Text>
							</Pressable>
						</View>

						<View style={styles.card}>
							<Text style={styles.cardLabel}>Starting balance</Text>
							<Pressable style={styles.balanceAmountWrap} onPress={focusBalance}>
								<Text style={[styles.balanceAmount, !amountDigits && styles.balanceAmountMuted]}>
									{formatAmountDisplay(amountDigits)}
								</Text>
								<TextInput
									ref={inputRef}
									value={amountDigits}
									onChangeText={(v) => setAmountDigits(sanitizeAmountDigits(v))}
									keyboardType="number-pad"
									style={styles.hiddenInput}
									caretHidden
									maxLength={9}
									inputAccessoryViewID={ACCESSORY_ID}
								/>
							</Pressable>
							<Text style={styles.cardHint}>
								Tap the amount to enter what you have on hand. We&apos;ll log it as an earned
								transaction so projections start from the right number.
							</Text>
						</View>

						<View style={styles.ctaWrap}>
							<Pressable style={styles.startBtn} onPress={() => submit(true)}>
								<Text style={styles.startText}>Get started</Text>
							</Pressable>
							<Pressable style={styles.skipBtn} onPress={() => submit(false)}>
								<Text style={styles.skipText}>Skip — I&apos;ll set this up later</Text>
							</Pressable>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>

				{Platform.OS === "ios" && (
					<InputAccessoryView nativeID={ACCESSORY_ID}>
						<View style={styles.kbAccessory}>
							<Pressable onPress={() => Keyboard.dismiss()} hitSlop={10} style={styles.kbAccessoryBtn}>
								<Ionicons name="checkmark" size={22} color={Palette.brand} />
								<Text style={styles.kbAccessoryText}>Done</Text>
							</Pressable>
						</View>
					</InputAccessoryView>
				)}

				<BudgetEditorSheet visible={budgetEditorOpen} onClose={() => setBudgetEditorOpen(false)} />
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
