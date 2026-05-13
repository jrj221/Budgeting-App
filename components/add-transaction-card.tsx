import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import type { StyleProp, TextStyle } from "react-native";
import {
	InputAccessoryView,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Switch,
	Text,
	TextInput,
	useWindowDimensions,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import {
	Category,
	formatDateLabel,
	formatRepeatSummary,
	MODE_LABELS,
	REPEAT_PERIOD_LABELS,
	RepeatConfig,
	RepeatEndMode,
	RepeatPeriod,
	submitButtonLabel,
	Transaction,
	TransactionMode,
} from "@/components/add-transaction-card.presenter";
import { styles } from "@/components/add-transaction-card.styles";
import { AmountInput } from "@/components/amount-input";
import { ColorPickerModal } from "@/components/color-picker-modal";
import { IconPickerModal } from "@/components/icon-picker-modal";
import { isColorSchemeDark, ModeColors, Palette, pickNextCategoryColor } from "@/constants/colors";
import { useAppTheme } from "@/contexts/theme-context";
import { useAddTransactionCard } from "@/hooks/use-add-transaction-card";

export type AddTransactionCardProps = {
	onSubmit?: (transactions: Transaction[]) => void;
};

const NUMPAD_ACCESSORY_ID = "number-pad-done";

export function AddTransactionCard({ onSubmit }: AddTransactionCardProps) {
	const presenter = useAddTransactionCard({ onSubmit });
	const { scheme } = useAppTheme();
	const isDark = isColorSchemeDark(scheme);
	return (
		<View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
			<ModeToggle mode={presenter.draft.mode} onChange={presenter.setMode} />

			<AmountInput
				digits={presenter.draft.amountDigits}
				onChangeDigits={presenter.setAmountFromInput}
				accessoryViewId={NUMPAD_ACCESSORY_ID}
				wrapStyle={styles.amountWrap}
				textStyle={[styles.amount, { color: scheme.text }]}
				placeholderStyle={styles.amountMuted}
			/>

			<TextInput
				style={[styles.titleInput, { backgroundColor: scheme.surface, color: scheme.text }]}
				placeholder="What's it for?"
				placeholderTextColor={scheme.textMuted}
				value={presenter.draft.title}
				onChangeText={presenter.setTitle}
				returnKeyType="done"
			/>

			<Pressable
				style={[styles.row, { backgroundColor: scheme.surface }]}
				onPress={() => {
					Keyboard.dismiss();
					presenter.toggleDatePicker();
				}}
			>
				<View style={styles.rowLeft}>
					<Ionicons name="calendar-outline" size={20} color={scheme.text} />
					<Text style={[styles.rowLabel, { color: scheme.text }]}>Date</Text>
				</View>
				<View style={styles.rowRight}>
					<Text style={[styles.rowValue, { color: scheme.text }]}>
						{formatDateLabel(presenter.draft.date)}
					</Text>
					<Ionicons
						name={presenter.isDatePickerOpen ? "chevron-up" : "chevron-down"}
						size={18}
						color={scheme.textMuted}
					/>
				</View>
			</Pressable>
			{presenter.isDatePickerOpen && (
				<View style={[styles.wheelWrap, { backgroundColor: scheme.cardBackground }]}>
					<DateTimePicker
						value={presenter.draft.date}
						mode="date"
						display="spinner"
						themeVariant={isDark ? "dark" : "light"}
						textColor={scheme.text}
						onChange={(_, d) => {
							if (d) presenter.setDate(d);
						}}
					/>
				</View>
			)}

			{presenter.draft.mode === "spent" && (
				<Pressable
					style={[styles.row, { backgroundColor: scheme.surface }]}
					onPress={() => {
						Keyboard.dismiss();
						presenter.openCategorySheet();
					}}
				>
					<View style={styles.rowLeft}>
						<Ionicons name="pricetag-outline" size={20} color={scheme.text} />
						<Text style={[styles.rowLabel, { color: scheme.text }]}>Category</Text>
					</View>
					<View style={styles.rowRight}>
						<Text
							style={[
								styles.rowValue,
								{ color: scheme.text },
								!presenter.selectedCategory && styles.rowValueMuted,
							]}
						>
							{presenter.selectedCategory?.name ?? "None"}
						</Text>
						<Ionicons name="chevron-forward" size={18} color={scheme.textMuted} />
					</View>
				</Pressable>
			)}

			<Pressable
				style={[styles.row, { backgroundColor: scheme.surface }]}
				onPress={() => {
					Keyboard.dismiss();
					presenter.openRepeatSheet();
				}}
			>
				<View style={styles.rowLeft}>
					<Ionicons name="repeat" size={20} color={scheme.text} />
					<Text style={[styles.rowLabel, { color: scheme.text }]}>Repeat</Text>
				</View>
				<View style={styles.rowRight}>
					<Text
						style={[
							styles.rowValue,
							{ color: scheme.text, fontSize: 10 },
							!presenter.repeat.enabled && styles.rowValueMuted,
						]}
					>
						{presenter.repeat.enabled ? formatRepeatSummary(presenter.repeat) : "Never"}
					</Text>
					<Ionicons name="chevron-forward" size={18} color={scheme.textMuted} />
				</View>
			</Pressable>

			<Pressable
				style={[styles.submit, !presenter.canSubmit && styles.submitDisabled]}
				onPress={presenter.submit}
				disabled={!presenter.canSubmit}
			>
				<Text style={styles.submitText}>{submitButtonLabel(presenter.draft.mode)}</Text>
			</Pressable>

			<CategorySheet
				visible={presenter.isCategorySheetOpen}
				categories={presenter.categories}
				selectedId={presenter.draft.categoryId}
				isEditing={presenter.isEditingCategories}
				newName={presenter.newCategoryName}
				onSelect={(id) => {
					presenter.selectCategory(id);
					presenter.closeCategorySheet();
				}}
				onClose={presenter.closeCategorySheet}
				onToggleEdit={presenter.toggleEditCategories}
				onDelete={presenter.deleteCategory}
				onChangeNewName={presenter.setNewCategoryName}
				onAdd={presenter.addCategory}
				onRename={presenter.renameCategory}
				onSetColor={presenter.setCategoryColor}
				onSetIcon={presenter.setCategoryIcon}
			/>

			<RepeatSheet
				visible={presenter.isRepeatSheetOpen}
				repeat={presenter.repeat}
				onClose={presenter.closeRepeatSheet}
				onSetEnabled={presenter.setRepeatEnabled}
				onSetEvery={presenter.setRepeatEvery}
				onSetPeriod={presenter.setRepeatPeriod}
				onSetEndMode={presenter.setRepeatEndMode}
				onSetEndDate={presenter.setRepeatEndDate}
				onSetCount={presenter.setRepeatCount}
			/>

			{Platform.OS === "ios" && (
				<InputAccessoryView nativeID={NUMPAD_ACCESSORY_ID}>
					<View
						style={[
							styles.kbAccessory,
							{ backgroundColor: scheme.background, borderTopColor: scheme.border },
						]}
					>
						<Pressable onPress={() => Keyboard.dismiss()} hitSlop={10} style={styles.kbAccessoryBtn}>
							<Ionicons name="checkmark" size={22} color={Palette.brand} />
							<Text style={styles.kbAccessoryText}>Done</Text>
						</Pressable>
					</View>
				</InputAccessoryView>
			)}
		</View>
	);
}

function ModeToggle({ mode, onChange }: { mode: TransactionMode; onChange: (m: TransactionMode) => void }) {
	const { scheme } = useAppTheme();
	const options: TransactionMode[] = ["spent", "earned"];
	return (
		<View style={[styles.toggle, { backgroundColor: scheme.toggleTrack }]}>
			{options.map((m) => {
				const active = mode === m;
				return (
					<Pressable
						key={m}
						style={[
							styles.toggleBtn,
							active && styles.toggleBtnActive,
							active && { backgroundColor: ModeColors[m] },
						]}
						onPress={() => onChange(m)}
					>
						<Text style={[styles.toggleText, active && styles.toggleTextActive]}>{MODE_LABELS[m]}</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

type CategorySheetProps = {
	visible: boolean;
	categories: Category[];
	selectedId: string | null;
	isEditing: boolean;
	newName: string;
	onSelect: (id: string | null) => void;
	onClose: () => void;
	onToggleEdit: () => void;
	onDelete: (id: string) => void;
	onChangeNewName: (s: string) => void;
	onAdd: (color?: string, icon?: string) => unknown;
	onRename: (id: string, name: string) => void;
	onSetColor: (id: string, color: string) => void;
	onSetIcon: (id: string, icon: string) => void;
};

function CategorySheet(props: CategorySheetProps) {
	const { scheme } = useAppTheme();
	const { height: windowHeight } = useWindowDimensions();
	const listMaxHeight = windowHeight * 0.5;
	const sheet = useSheetGesture(props.visible, props.onClose);

	return (
		<Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
					<Animated.View
						style={[
							styles.sheet,
							{ backgroundColor: scheme.background },
							sheet.animatedStyle,
							props.isEditing && { paddingBottom: 24, marginBottom: 0 },
						]}
					>
						<Pressable onPress={() => {}}>
							<GestureDetector gesture={sheet.gesture}>
								<View style={styles.sheetGrabber}>
									<View style={styles.sheetHandle} />
									<View style={[styles.sheetHeader, { borderBottomColor: scheme.border }]}>
										<Pressable onPress={props.onClose} hitSlop={10}>
											<Text style={[styles.sheetCancel, { color: scheme.text }]}>Cancel</Text>
										</Pressable>
										<Text style={[styles.sheetTitle, { color: scheme.text }]}>Category</Text>
										<Pressable onPress={props.onToggleEdit} hitSlop={10}>
											<Text style={styles.sheetEdit}>{props.isEditing ? "Done" : "Edit"}</Text>
										</Pressable>
									</View>
								</View>
							</GestureDetector>

							<ScrollView
								style={{ maxHeight: listMaxHeight }}
								keyboardShouldPersistTaps="handled"
								showsVerticalScrollIndicator={false}
							>
								{props.isEditing ? (
									<View>
										{props.categories
											.filter((c) => !c.isGoal)
											.map((cat) => (
												<EditableCategoryRow
													key={cat.id}
													category={cat}
													onDelete={() => props.onDelete(cat.id)}
													onRename={(name) => props.onRename(cat.id, name)}
													onSetColor={(c) => props.onSetColor(cat.id, c)}
													onSetIcon={(ic) => props.onSetIcon(cat.id, ic)}
												/>
											))}
									</View>
								) : (
									<View style={styles.catGrid}>
										<Pressable
											style={[
												styles.catGridCell,
												{ backgroundColor: scheme.surface, borderColor: scheme.border },
												props.selectedId === null && styles.catGridCellSelected,
												props.selectedId === null && { backgroundColor: scheme.cardBackground },
											]}
											onPress={() => props.onSelect(null)}
										>
											<View style={[styles.catGridIcon, { backgroundColor: scheme.toggleTrack }]}>
												<Ionicons name="ban" size={20} color={scheme.textMuted} />
											</View>
											<Text
												style={[styles.catGridLabel, { color: scheme.text }]}
												numberOfLines={1}
											>
												None
											</Text>
										</Pressable>
										{props.categories
											.filter((c) => !c.isGoal)
											.map((cat) => {
												const sel = props.selectedId === cat.id;
												return (
													<Pressable
														key={cat.id}
														style={[
															styles.catGridCell,
															{
																backgroundColor: scheme.surface,
																borderColor: scheme.border,
															},
															sel && styles.catGridCellSelected,
															sel && { backgroundColor: scheme.cardBackground },
														]}
														onPress={() => props.onSelect(cat.id)}
													>
														<View
															style={[
																styles.catGridIcon,
																{ backgroundColor: cat.color + "22" },
															]}
														>
															<FontAwesome5
																name={cat.icon as any}
																size={20}
																color={cat.color}
																solid
															/>
														</View>
														<Text
															style={[styles.catGridLabel, { color: scheme.text }]}
															numberOfLines={1}
														>
															{cat.name}
														</Text>
														{sel && (
															<View style={styles.catGridCheck}>
																<Ionicons
																	name="checkmark-circle"
																	size={16}
																	color={Palette.brand}
																/>
															</View>
														)}
													</Pressable>
												);
											})}
									</View>
								)}
							</ScrollView>
							{props.isEditing && (
								<AddCategoryRow
									name={props.newName}
									existingColors={props.categories.map((c) => c.color)}
									onChangeName={props.onChangeNewName}
									onSubmit={(color: string, icon: string) => {
										props.onAdd(color, icon);
									}}
								/>
							)}
						</Pressable>
					</Animated.View>
				</Pressable>
			</KeyboardAvoidingView>
		</Modal>
	);
}

function EditableCategoryRow({
	category,
	onDelete,
	onRename,
	onSetColor,
	onSetIcon,
}: {
	category: Category;
	onDelete: () => void;
	onRename: (name: string) => void;
	onSetColor: (color: string) => void;
	onSetIcon: (icon: string) => void;
}) {
	const { scheme } = useAppTheme();
	const [editing, setEditing] = useState(false);
	const [draftName, setDraftName] = useState(category.name);
	const [colorPickerOpen, setColorPickerOpen] = useState(false);
	const [iconPickerOpen, setIconPickerOpen] = useState(false);

	useEffect(() => {
		setDraftName(category.name);
	}, [category.name]);

	const commit = () => {
		setEditing(false);
		const trimmed = draftName.trim();
		if (trimmed.length > 0 && trimmed !== category.name) onRename(trimmed);
		else setDraftName(category.name);
	};

	return (
		<View style={styles.sheetRow}>
			<Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
				<Ionicons name="remove-circle" size={22} color={Palette.spent} />
			</Pressable>
			<View style={styles.sheetRowSelect}>
				<View style={styles.categoryRowLeft}>
					<Pressable
						onPress={() => setColorPickerOpen(true)}
						hitSlop={6}
						style={[styles.editColorBtn, { backgroundColor: scheme.cardBackground }]}
					>
						<View style={[styles.categoryDot, { backgroundColor: category.color }]} />
						<View style={[styles.editColorBadge, { backgroundColor: scheme.cardBackground }]}>
							<Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
						</View>
					</Pressable>
					<Pressable
						onPress={() => setIconPickerOpen(true)}
						hitSlop={6}
						style={[styles.editColorBtn, { backgroundColor: scheme.cardBackground }]}
					>
						<FontAwesome5 name={category.icon as any} size={14} color={category.color} solid />
					</Pressable>
					{editing ? (
						<TextInput
							style={[styles.sheetRowText, { flex: 1, color: scheme.text }]}
							value={draftName}
							onChangeText={setDraftName}
							autoFocus
							onBlur={commit}
							onSubmitEditing={commit}
							returnKeyType="done"
						/>
					) : (
						<Pressable onPress={() => setEditing(true)} style={{ flex: 1 }}>
							<Text style={[styles.sheetRowText, { color: scheme.text }]}>{category.name}</Text>
						</Pressable>
					)}
				</View>
				<Pressable onPress={() => setEditing(true)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
					<Ionicons name="create-outline" size={18} color={Palette.iconMuted} />
				</Pressable>
			</View>
			<ColorPickerModal
				visible={colorPickerOpen}
				initialColor={category.color}
				title={`Color for ${category.name}`}
				onClose={() => setColorPickerOpen(false)}
				onSelect={onSetColor}
			/>
			<IconPickerModal
				visible={iconPickerOpen}
				selected={category.icon}
				color={category.color}
				title={`Icon for ${category.name}`}
				onClose={() => setIconPickerOpen(false)}
				onSelect={onSetIcon}
			/>
		</View>
	);
}

function AddCategoryRow({
	name,
	existingColors,
	onChangeName,
	onSubmit,
}: {
	name: string;
	existingColors: string[];
	onChangeName: (s: string) => void;
	onSubmit: (color: string, icon: string) => void;
}) {
	const { scheme } = useAppTheme();
	const [color, setColor] = useState<string>(() => pickNextCategoryColor(existingColors));
	const [icon, setIcon] = useState("tag");
	const [colorPickerOpen, setColorPickerOpen] = useState(false);
	const [iconPickerOpen, setIconPickerOpen] = useState(false);

	useEffect(() => {
		if (!existingColors.includes(color)) return;
		setColor(pickNextCategoryColor(existingColors));
	}, [existingColors, color]);

	const canAdd = name.trim().length > 0;
	const submit = () => {
		if (!canAdd) return;
		onSubmit(color, icon);
		setColor(pickNextCategoryColor([...existingColors, color]));
		setIcon("tag");
	};

	return (
		<View style={styles.addRow}>
			<Pressable
				onPress={() => setColorPickerOpen(true)}
				hitSlop={6}
				style={[styles.editColorBtn, { backgroundColor: scheme.cardBackground }]}
			>
				<View style={[styles.categoryDot, { backgroundColor: color }]} />
				<View style={[styles.editColorBadge, { backgroundColor: scheme.cardBackground }]}>
					<Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
				</View>
			</Pressable>
			<Pressable
				onPress={() => setIconPickerOpen(true)}
				hitSlop={6}
				style={[styles.editColorBtn, { backgroundColor: color + "18" }]}
			>
				<FontAwesome5 name={icon as any} size={14} color={color} solid />
			</Pressable>
			<TextInput
				style={[styles.addInput, { backgroundColor: scheme.surface, color: scheme.text }]}
				placeholder="New category name"
				placeholderTextColor={Palette.iconMuted}
				value={name}
				onChangeText={onChangeName}
				returnKeyType="done"
				onSubmitEditing={submit}
			/>
			<Pressable onPress={submit} disabled={!canAdd} hitSlop={6}>
				<Ionicons name="add-circle" size={30} color={canAdd ? Palette.brand : Palette.submitDisabled} />
			</Pressable>
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

type RepeatSheetProps = {
	visible: boolean;
	repeat: RepeatConfig;
	onClose: () => void;
	onSetEnabled: (enabled: boolean) => void;
	onSetEvery: (every: number) => void;
	onSetPeriod: (period: RepeatPeriod) => void;
	onSetEndMode: (mode: RepeatEndMode) => void;
	onSetEndDate: (date: Date) => void;
	onSetCount: (count: number) => void;
};

function RepeatSheet(props: RepeatSheetProps) {
	const { scheme } = useAppTheme();
	const sheet = useSheetGesture(props.visible, props.onClose);
	const periodOptions: RepeatPeriod[] = ["weeks", "months"];
	const endModeOptions: RepeatEndMode[] = ["date", "count"];
	const periodLabel = (p: RepeatPeriod) =>
		props.repeat.every === 1 ? REPEAT_PERIOD_LABELS[p].singular : REPEAT_PERIOD_LABELS[p].plural;

	return (
		<Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
					<Animated.View style={[styles.sheet, { backgroundColor: scheme.background }, sheet.animatedStyle]}>
						<Pressable onPress={() => {}}>
							<GestureDetector gesture={sheet.gesture}>
								<View style={styles.sheetGrabber}>
									<View style={styles.sheetHandle} />
									<View style={[styles.sheetHeader, { borderBottomColor: scheme.border }]}>
										<Pressable onPress={props.onClose} hitSlop={10}>
											<Text style={[styles.sheetCancel, { color: scheme.text }]}>Cancel</Text>
										</Pressable>
										<Text style={[styles.sheetTitle, { color: scheme.text }]}>Repeat</Text>
										<View style={styles.sheetHeaderSpacer} />
									</View>
								</View>
							</GestureDetector>

							<View style={styles.repeatBody}>
								<View
									style={[
										styles.repeatToggleRow,
										{ backgroundColor: scheme.surface, borderColor: scheme.border },
									]}
								>
									<View style={styles.rowLeft}>
										<Ionicons name="repeat" size={20} color={scheme.text} />
										<Text style={[styles.rowLabel, { color: scheme.text }]}>
											Repeat this transaction
										</Text>
									</View>
									<Switch
										value={props.repeat.enabled}
										onValueChange={props.onSetEnabled}
										trackColor={{ false: Palette.switchTrackOff, true: Palette.brand }}
										ios_backgroundColor={Palette.switchTrackOff}
									/>
								</View>

								{props.repeat.enabled && (
									<>
										<View style={styles.repeatEveryRow}>
											<Text style={[styles.repeatEveryLabel, { color: scheme.text }]}>Every</Text>
											<NumberField
												style={[
													styles.repeatNumberInput,
													{ backgroundColor: scheme.surface, color: scheme.text },
												]}
												value={props.repeat.every}
												onCommit={props.onSetEvery}
												maxLength={3}
											/>
											<View
												style={[styles.periodToggle, { backgroundColor: scheme.toggleTrack }]}
											>
												{periodOptions.map((p) => {
													const active = props.repeat.period === p;
													return (
														<Pressable
															key={p}
															onPress={() => props.onSetPeriod(p)}
															style={[
																styles.periodBtn,
																active && styles.periodBtnActive,
																active && { backgroundColor: scheme.cardBackground },
															]}
														>
															<Text
																style={[
																	styles.periodText,
																	{ color: scheme.textMuted },
																	active && [
																		styles.periodTextActive,
																		{ color: scheme.text },
																	],
																]}
															>
																{periodLabel(p)}
															</Text>
														</Pressable>
													);
												})}
											</View>
										</View>

										<View style={[styles.endModeToggle, { backgroundColor: scheme.toggleTrack }]}>
											{endModeOptions.map((m) => {
												const active = props.repeat.endMode === m;
												return (
													<Pressable
														key={m}
														onPress={() => props.onSetEndMode(m)}
														style={[
															styles.endModeBtn,
															active && styles.endModeBtnActive,
															active && { backgroundColor: scheme.cardBackground },
														]}
													>
														<Text
															style={[
																styles.endModeText,
																{ color: scheme.textMuted },
																active && [
																	styles.endModeTextActive,
																	{ color: scheme.text },
																],
															]}
														>
															{m === "date" ? "Until date" : "After N times"}
														</Text>
													</Pressable>
												);
											})}
										</View>

										{props.repeat.endMode === "date" ? (
											<View
												style={[styles.wheelWrap, { backgroundColor: scheme.cardBackground }]}
											>
												<DateTimePicker
													value={props.repeat.endDate}
													mode="date"
													display="spinner"
													themeVariant="light"
													textColor={scheme.text}
													onChange={(_, d) => {
														if (d) props.onSetEndDate(d);
													}}
												/>
											</View>
										) : (
											<View style={[styles.row, { backgroundColor: scheme.surface }]}>
												<Text style={[styles.rowLabel, { color: scheme.text }]}>
													Number of occurrences
												</Text>
												<NumberField
													style={[
														styles.repeatNumberInput,
														{ backgroundColor: scheme.surface, color: scheme.text },
													]}
													value={props.repeat.count}
													onCommit={props.onSetCount}
													maxLength={3}
												/>
											</View>
										)}

										<Text style={[styles.repeatSummary, { color: scheme.textMuted }]}>
											{formatRepeatSummary(props.repeat)}
										</Text>
									</>
								)}
							</View>
						</Pressable>
					</Animated.View>
				</Pressable>
			</KeyboardAvoidingView>
		</Modal>
	);
}

function NumberField({
	value,
	onCommit,
	style,
	maxLength,
}: {
	value: number;
	onCommit: (n: number) => void;
	style?: StyleProp<TextStyle>;
	maxLength?: number;
}) {
	const [draft, setDraft] = useState(String(value));
	useEffect(() => {
		setDraft(String(value));
	}, [value]);
	return (
		<TextInput
			style={style}
			keyboardType="number-pad"
			maxLength={maxLength}
			inputAccessoryViewID={NUMPAD_ACCESSORY_ID}
			value={draft}
			onChangeText={(v) => {
				const cleaned = v.replace(/\D/g, "");
				setDraft(cleaned);
				if (cleaned !== "") {
					const n = parseInt(cleaned, 10);
					if (Number.isFinite(n) && n >= 1) onCommit(n);
				}
			}}
			onBlur={() => {
				const n = parseInt(draft, 10);
				if (draft === "" || !Number.isFinite(n) || n < 1) {
					setDraft("1");
					onCommit(1);
				}
			}}
		/>
	);
}

function useSheetGesture(visible: boolean, onClose: () => void) {
	const translateY = useSharedValue(0);
	const baseY = useSharedValue(0);

	useEffect(() => {
		if (visible) {
			translateY.value = 0;
			baseY.value = 0;
		}
	}, [visible, translateY, baseY]);

	const gesture = Gesture.Pan()
		.onUpdate((e) => {
			translateY.value = baseY.value + e.translationY;
		})
		.onEnd((e) => {
			const finalY = baseY.value + e.translationY;
			if (finalY > 120 || e.velocityY > 800) {
				baseY.value = 0;
				translateY.value = withTiming(0, { duration: 300 });
				runOnJS(onClose)();
			} else if (finalY < 0) {
				baseY.value = 0;
				translateY.value = withTiming(0, { duration: 300 });
			} else {
				baseY.value = finalY;
				translateY.value = finalY;
			}
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	return { gesture, animatedStyle };
}
