import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
	InputAccessoryView,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Category } from "@/components/add-transaction-card.presenter";
import { budgetEditorStyles as styles } from "@/components/budget-editor-sheet.styles";
import { ColorPickerModal } from "@/components/color-picker-modal";
import { IconPickerModal } from "@/components/icon-picker-modal";
import { Palette, pickNextCategoryColor } from "@/constants/colors";
import { useCategories } from "@/contexts/categories-context";
import { useAppTheme } from "@/contexts/theme-context";

const ACCESSORY_ID = "budget-editor-done";

type BudgetEditorSheetProps = {
	visible: boolean;
	onClose: () => void;
	/** When true, primary button reads "Save and continue" and a Skip option is shown. */
	tourMode?: boolean;
	onSkip?: () => void;
};

export function BudgetEditorSheet({ visible, onClose, tourMode = false, onSkip }: BudgetEditorSheetProps) {
	const { scheme } = useAppTheme();
	const {
		categories,
		addCategory,
		deleteCategory,
		renameCategory,
		setCategoryColor,
		setCategoryIcon,
		setCategoryBudget,
	} = useCategories();

	const translateY = useSharedValue(0);
	const baseY = useSharedValue(0);

	useEffect(() => {
		if (visible) {
			translateY.value = 0;
			baseY.value = 0;
		}
	}, [visible, translateY, baseY]);

	const dragGesture = useMemo(
		() =>
			Gesture.Pan()
				.onUpdate((e) => {
					translateY.value = Math.max(0, baseY.value + e.translationY);
				})
				.onEnd((e) => {
					const finalY = Math.max(0, baseY.value + e.translationY);
					if (finalY > 120 || e.velocityY > 800) {
						baseY.value = 0;
						translateY.value = withTiming(0, { duration: 180 });
						runOnJS(onClose)();
					} else {
						baseY.value = 0;
						translateY.value = withTiming(0, { duration: 180 });
					}
				}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[onClose],
	);

	const sheetAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<Pressable style={styles.backdrop} onPress={onClose} />
				<Animated.View style={[styles.sheet, { backgroundColor: scheme.background }, sheetAnimatedStyle]}>
					<GestureDetector gesture={dragGesture}>
						<View style={styles.dragHandleArea}>
							<View style={styles.grabber} />
							<View style={styles.header}>
								<Pressable onPress={onClose} hitSlop={10}>
									<Text style={styles.headerLeft}>{tourMode ? "Later" : "Cancel"}</Text>
								</Pressable>
								<Text style={[styles.headerTitle, { color: scheme.text }]}>Budget</Text>
								<Pressable onPress={onClose} hitSlop={10}>
									<Text style={styles.headerRight}>{tourMode ? "" : "Done"}</Text>
								</Pressable>
							</View>
						</View>
					</GestureDetector>

					<ScrollView
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingBottom: 8 }}
					>
						<Text style={[styles.hint, { color: scheme.textMuted }]}>
							Pick how much you want to spend each week. Monthly is auto-calculated as weekly × 4 — toggle
							to manual to set it yourself.
						</Text>

						<View style={styles.list}>
							{categories
								.filter((c) => !c.isGoal)
								.map((cat) => (
									<CategoryRow
										key={cat.id}
										category={cat}
										onRename={renameCategory}
										onDelete={deleteCategory}
										onSetColor={setCategoryColor}
										onSetIcon={setCategoryIcon}
										onSetBudget={setCategoryBudget}
									/>
								))}

							<AddCategoryRow
								existingColors={categories.map((c) => c.color)}
								onAdd={(name, color, icon) => addCategory(name, color, false, icon)}
							/>
						</View>

						{tourMode && (
							<>
								<Pressable style={styles.primaryBtn} onPress={onClose}>
									<Text style={styles.primaryText}>Save and continue</Text>
								</Pressable>
								{onSkip && (
									<Pressable style={styles.skipBtn} onPress={onSkip}>
										<Text style={styles.skipText}>Skip — set this up later</Text>
									</Pressable>
								)}
							</>
						)}
					</ScrollView>
				</Animated.View>
			</KeyboardAvoidingView>

			{Platform.OS === "ios" && (
				<InputAccessoryView nativeID={ACCESSORY_ID}>
					<View
						style={[styles.kbAccessory, { backgroundColor: scheme.surface, borderTopColor: scheme.border }]}
					>
						<Pressable onPress={() => Keyboard.dismiss()} hitSlop={10} style={styles.kbAccessoryBtn}>
							<Ionicons name="checkmark" size={22} color={Palette.brand} />
							<Text style={styles.kbAccessoryText}>Done</Text>
						</Pressable>
					</View>
				</InputAccessoryView>
			)}
		</Modal>
	);
}

function CategoryRow({
	category,
	onRename,
	onDelete,
	onSetColor,
	onSetIcon,
	onSetBudget,
}: {
	category: Category;
	onRename: (id: string, name: string) => void;
	onDelete: (id: string) => void;
	onSetColor: (id: string, color: string) => void;
	onSetIcon: (id: string, icon: string) => void;
	onSetBudget: (id: string, weeklyCents: number | null, monthlyOverrideCents: number | null) => void;
}) {
	const { scheme } = useAppTheme();
	const [editingName, setEditingName] = useState(false);
	const [draftName, setDraftName] = useState(category.name);
	const [colorPickerOpen, setColorPickerOpen] = useState(false);
	const [iconPickerOpen, setIconPickerOpen] = useState(false);
	const [weeklyDraft, setWeeklyDraft] = useState(
		category.weeklyBudgetCents != null ? String(Math.round(category.weeklyBudgetCents / 100)) : "",
	);
	const monthlyMode: "auto" | "manual" = category.monthlyOverrideCents == null ? "auto" : "manual";
	const monthlyAutoDollars =
		category.weeklyBudgetCents != null ? Math.round((category.weeklyBudgetCents * 4) / 100) : 0;
	const [manualMonthlyDraft, setManualMonthlyDraft] = useState(
		category.monthlyOverrideCents != null ? String(Math.round(category.monthlyOverrideCents / 100)) : "",
	);

	useEffect(() => {
		setDraftName(category.name);
		setWeeklyDraft(category.weeklyBudgetCents != null ? String(Math.round(category.weeklyBudgetCents / 100)) : "");
		setManualMonthlyDraft(
			category.monthlyOverrideCents != null ? String(Math.round(category.monthlyOverrideCents / 100)) : "",
		);
	}, [category.id, category.name, category.weeklyBudgetCents, category.monthlyOverrideCents]);

	const commitName = () => {
		setEditingName(false);
		if (draftName.trim() && draftName.trim() !== category.name) {
			onRename(category.id, draftName.trim());
		} else {
			setDraftName(category.name);
		}
	};

	const commitWeekly = (raw: string) => {
		const dollars = parseInt(raw.replace(/\D/g, ""), 10);
		const cents = Number.isFinite(dollars) && dollars > 0 ? dollars * 100 : null;
		onSetBudget(category.id, cents, category.monthlyOverrideCents);
	};

	const commitManualMonthly = (raw: string) => {
		const dollars = parseInt(raw.replace(/\D/g, ""), 10);
		const cents = Number.isFinite(dollars) && dollars > 0 ? dollars * 100 : null;
		onSetBudget(category.id, category.weeklyBudgetCents, cents);
	};

	const switchToAuto = () => {
		onSetBudget(category.id, category.weeklyBudgetCents, null);
	};

	const switchToManual = () => {
		const fallback = category.weeklyBudgetCents != null ? category.weeklyBudgetCents * 4 : 0;
		onSetBudget(category.id, category.weeklyBudgetCents, fallback);
	};

	return (
		<View style={[styles.catRow, { backgroundColor: scheme.surface }]}>
			<View style={styles.catRowTop}>
				<Pressable
					onPress={() => setColorPickerOpen(true)}
					hitSlop={6}
					style={[styles.editColorBtn, { backgroundColor: scheme.background }]}
				>
					<View style={[styles.catDot, { backgroundColor: category.color }]} />
					<View style={[styles.editColorBadge, { backgroundColor: scheme.background }]}>
						<Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
					</View>
				</Pressable>
				<Pressable
					onPress={() => setIconPickerOpen(true)}
					hitSlop={6}
					style={[styles.editColorBtn, { backgroundColor: scheme.background }]}
				>
					<FontAwesome5 name={category.icon as any} size={14} color={category.color} solid />
				</Pressable>
				{editingName ? (
					<TextInput
						style={[styles.catNameInput, { color: scheme.text, borderBottomColor: Palette.brand }]}
						value={draftName}
						onChangeText={setDraftName}
						placeholderTextColor={scheme.textMuted}
						autoFocus
						onBlur={commitName}
						onSubmitEditing={commitName}
						returnKeyType="done"
					/>
				) : (
					<Pressable style={{ flex: 1 }} onPress={() => setEditingName(true)}>
						<Text style={[styles.catName, { color: scheme.text }]}>{category.name}</Text>
					</Pressable>
				)}
				<Pressable style={styles.iconBtn} onPress={() => onDelete(category.id)} hitSlop={6}>
					<Ionicons name="trash-outline" size={18} color={Palette.spent} />
				</Pressable>
			</View>

			<ColorPickerModal
				visible={colorPickerOpen}
				initialColor={category.color}
				title={`Color for ${category.name}`}
				onClose={() => setColorPickerOpen(false)}
				onSelect={(hex) => onSetColor(category.id, hex)}
			/>
			<IconPickerModal
				visible={iconPickerOpen}
				selected={category.icon}
				color={category.color}
				title={`Icon for ${category.name}`}
				onClose={() => setIconPickerOpen(false)}
				onSelect={(ic) => onSetIcon(category.id, ic)}
			/>

			<View style={styles.budgetRow}>
				<Text style={[styles.budgetLabel, { color: scheme.textMuted }]}>Weekly</Text>
				<TextInput
					style={[
						styles.budgetInput,
						{ backgroundColor: scheme.surface, color: scheme.text, borderColor: scheme.border },
					]}
					keyboardType="number-pad"
					inputAccessoryViewID={ACCESSORY_ID}
					placeholder="$"
					placeholderTextColor={scheme.textMuted}
					value={weeklyDraft ? `$${weeklyDraft}` : ""}
					onChangeText={(v) => {
						const digits = v.replace(/\D/g, "");
						setWeeklyDraft(digits);
					}}
					onBlur={() => commitWeekly(weeklyDraft)}
					onEndEditing={() => commitWeekly(weeklyDraft)}
				/>
			</View>

			<View style={styles.budgetRow}>
				<Text style={[styles.budgetLabel, { color: scheme.textMuted }]}>Monthly</Text>
				<TextInput
					style={[
						styles.budgetInput,
						{ backgroundColor: scheme.surface, color: scheme.text, borderColor: scheme.border },
						monthlyMode === "auto" && { backgroundColor: scheme.toggleTrack, color: scheme.textMuted },
					]}
					keyboardType="number-pad"
					inputAccessoryViewID={ACCESSORY_ID}
					placeholder="$"
					placeholderTextColor={scheme.textMuted}
					editable={monthlyMode === "manual"}
					value={
						monthlyMode === "auto"
							? monthlyAutoDollars > 0
								? `$${monthlyAutoDollars}`
								: ""
							: manualMonthlyDraft
								? `$${manualMonthlyDraft}`
								: ""
					}
					onChangeText={(v) => {
						const digits = v.replace(/\D/g, "");
						setManualMonthlyDraft(digits);
					}}
					onBlur={() => commitManualMonthly(manualMonthlyDraft)}
					onEndEditing={() => commitManualMonthly(manualMonthlyDraft)}
				/>
				<View style={[styles.modeToggle, { backgroundColor: scheme.toggleTrack }]}>
					{(["auto", "manual"] as const).map((m) => {
						const active = monthlyMode === m;
						return (
							<Pressable
								key={m}
								onPress={() => (m === "auto" ? switchToAuto() : switchToManual())}
								style={[
									styles.modeBtn,
									active && styles.modeBtnActive,
									active && { backgroundColor: scheme.cardBackground },
								]}
							>
								<Text
									style={[
										styles.modeText,
										{ color: scheme.textMuted },
										active && [styles.modeTextActive, { color: scheme.text }],
									]}
								>
									{m}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>
		</View>
	);
}

function AddCategoryRow({
	existingColors,
	onAdd,
}: {
	existingColors: string[];
	onAdd: (name: string, color: string, icon: string) => unknown;
}) {
	const { scheme } = useAppTheme();
	const [name, setName] = useState("");
	const [color, setColor] = useState<string>(() => pickNextCategoryColor(existingColors));
	const [icon, setIcon] = useState("tag");
	const [colorPickerOpen, setColorPickerOpen] = useState(false);
	const [iconPickerOpen, setIconPickerOpen] = useState(false);

	// Re-suggest a color whenever the existing palette shifts (after add/delete) and
	// the user hasn't manually picked a still-present color.
	useEffect(() => {
		if (!existingColors.includes(color)) return;
		setColor(pickNextCategoryColor(existingColors));
	}, [existingColors, color]);

	const trimmed = name.trim();
	const canAdd = trimmed.length > 0;

	const submit = () => {
		if (!canAdd) return;
		onAdd(trimmed, color, icon);
		setName("");
		setIcon("tag");
		setColor(pickNextCategoryColor([...existingColors, color]));
	};

	return (
		<View style={[styles.addColumn, { backgroundColor: scheme.surface, borderColor: scheme.border }]}>
			<View style={styles.addColumnHeader}>
				<Pressable
					onPress={() => setColorPickerOpen(true)}
					hitSlop={6}
					style={[styles.editColorBtn, { backgroundColor: scheme.background }]}
				>
					<View style={[styles.catDot, { backgroundColor: color }]} />
					<View style={[styles.editColorBadge, { backgroundColor: scheme.background }]}>
						<Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
					</View>
				</Pressable>
				<Pressable
					onPress={() => setIconPickerOpen(true)}
					hitSlop={6}
					style={[styles.editColorBtn, { backgroundColor: color + "18" }]}
				>
					<Ionicons name="apps-sharp" size={14} color={color} />
				</Pressable>
				<Text style={[styles.addColumnTitle, { color: scheme.text }]}>Add a budget</Text>
			</View>
			<TextInput
				style={[
					styles.addColumnInput,
					{ backgroundColor: scheme.background, color: scheme.text, borderColor: scheme.border },
				]}
				placeholder="Budget name"
				placeholderTextColor={scheme.textMuted}
				value={name}
				onChangeText={setName}
				onSubmitEditing={submit}
				returnKeyType="done"
			/>
			<View style={styles.addColumnFooter}>
				<Pressable
					onPress={submit}
					disabled={!canAdd}
					style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
				>
					<Text style={styles.addBtnText}>Add</Text>
				</Pressable>
			</View>

			<ColorPickerModal
				visible={colorPickerOpen}
				initialColor={color}
				title="Pick a color"
				onClose={() => setColorPickerOpen(false)}
				onSelect={setColor}
			/>
			<IconPickerModal
				visible={iconPickerOpen}
				selected={icon}
				color={color}
				title="Pick an icon"
				onClose={() => setIconPickerOpen(false)}
				onSelect={setIcon}
			/>
		</View>
	);
}
