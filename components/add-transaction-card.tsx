import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useRef, useState } from "react";
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
	formatAmountDisplay,
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
import { ColorPickerModal } from "@/components/color-picker-modal";
import { ModeColors, Palette, pickNextCategoryColor } from "@/constants/colors";
import { useAddTransactionCard } from "@/hooks/use-add-transaction-card";

export type AddTransactionCardProps = {
	onSubmit?: (transactions: Transaction[]) => void;
};

const NUMPAD_ACCESSORY_ID = "number-pad-done";

export function AddTransactionCard({ onSubmit }: AddTransactionCardProps) {
	const presenter = useAddTransactionCard({ onSubmit });
	const amountInputRef = useRef<TextInput>(null);

	return (
		<View style={styles.card}>
			<ModeToggle mode={presenter.draft.mode} onChange={presenter.setMode} />

			<Pressable style={styles.amountWrap} onPress={() => amountInputRef.current?.focus()}>
				<Text style={[styles.amount, !presenter.draft.amountDigits && styles.amountMuted]}>
					{formatAmountDisplay(presenter.draft.amountDigits)}
				</Text>
				<TextInput
					ref={amountInputRef}
					value={presenter.draft.amountDigits}
					onChangeText={presenter.setAmountFromInput}
					keyboardType="number-pad"
					style={styles.hiddenInput}
					caretHidden
					maxLength={9}
					inputAccessoryViewID={NUMPAD_ACCESSORY_ID}
				/>
			</Pressable>

			<TextInput
				style={styles.titleInput}
				placeholder="What's it for?"
				placeholderTextColor={Palette.iconMuted}
				value={presenter.draft.title}
				onChangeText={presenter.setTitle}
				returnKeyType="done"
			/>

			<Pressable
				style={styles.row}
				onPress={() => {
					Keyboard.dismiss();
					presenter.toggleDatePicker();
				}}
			>
				<View style={styles.rowLeft}>
					<Ionicons name="calendar-outline" size={20} color={Palette.text} />
					<Text style={styles.rowLabel}>Date</Text>
				</View>
				<View style={styles.rowRight}>
					<Text style={styles.rowValue}>{formatDateLabel(presenter.draft.date)}</Text>
					<Ionicons
						name={presenter.isDatePickerOpen ? "chevron-up" : "chevron-down"}
						size={18}
						color={Palette.iconMuted}
					/>
				</View>
			</Pressable>
			{presenter.isDatePickerOpen && (
				<View style={styles.wheelWrap}>
					<DateTimePicker
						value={presenter.draft.date}
						mode="date"
						display="spinner"
						themeVariant="light"
						textColor={Palette.text}
						onChange={(_, d) => {
							if (d) presenter.setDate(d);
						}}
					/>
				</View>
			)}

			{presenter.draft.mode === "spent" && (
				<Pressable
					style={styles.row}
					onPress={() => {
						Keyboard.dismiss();
						presenter.openCategorySheet();
					}}
				>
					<View style={styles.rowLeft}>
						<Ionicons name="pricetag-outline" size={20} color={Palette.text} />
						<Text style={styles.rowLabel}>Category</Text>
					</View>
					<View style={styles.rowRight}>
						<Text style={[styles.rowValue, !presenter.selectedCategory && styles.rowValueMuted]}>
							{presenter.selectedCategory?.name ?? "None"}
						</Text>
						<Ionicons name="chevron-forward" size={18} color={Palette.iconMuted} />
					</View>
				</Pressable>
			)}

			<Pressable
				style={styles.row}
				onPress={() => {
					Keyboard.dismiss();
					presenter.openRepeatSheet();
				}}
			>
				<View style={styles.rowLeft}>
					<Ionicons name="repeat" size={20} color={Palette.text} />
					<Text style={styles.rowLabel}>Repeat</Text>
				</View>
				<View style={styles.rowRight}>
					<Text style={[styles.rowValue, !presenter.repeat.enabled && styles.rowValueMuted]}>
						{presenter.repeat.enabled ? formatRepeatSummary(presenter.repeat) : "Never"}
					</Text>
					<Ionicons name="chevron-forward" size={18} color={Palette.iconMuted} />
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
					<View style={styles.kbAccessory}>
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
	const options: TransactionMode[] = ["spent", "earned"];
	return (
		<View style={styles.toggle}>
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
	onAdd: (color?: string) => unknown;
	onRename: (id: string, name: string) => void;
	onSetColor: (id: string, color: string) => void;
};

function CategorySheet(props: CategorySheetProps) {
	const { height: windowHeight } = useWindowDimensions();
	const listMaxHeight = windowHeight * 0.5;
	const sheet = useSheetGesture(props.visible, props.onClose);

	return (
		<Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
					<Animated.View style={[styles.sheet, sheet.animatedStyle]}>
						<Pressable onPress={() => {}}>
							<GestureDetector gesture={sheet.gesture}>
								<View style={styles.sheetGrabber}>
									<View style={styles.sheetHandle} />
									<View style={styles.sheetHeader}>
									<Pressable onPress={props.onClose} hitSlop={10}>
										<Text style={styles.sheetCancel}>Cancel</Text>
									</Pressable>
									<Text style={styles.sheetTitle}>Category</Text>
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
							{!props.isEditing && (
								<Pressable style={styles.sheetRow} onPress={() => props.onSelect(null)}>
									<View style={styles.sheetRowSelect}>
										<Text style={[styles.sheetRowText, styles.sheetRowMuted]}>None</Text>
										{props.selectedId === null && (
											<Ionicons name="checkmark" size={20} color={Palette.brand} />
										)}
									</View>
								</Pressable>
							)}

							{props.categories.map((cat) =>
								props.isEditing ? (
									<EditableCategoryRow
										key={cat.id}
										category={cat}
										onDelete={() => props.onDelete(cat.id)}
										onRename={(name) => props.onRename(cat.id, name)}
										onSetColor={(c) => props.onSetColor(cat.id, c)}
									/>
								) : (
									<View key={cat.id} style={styles.sheetRow}>
										<Pressable
											style={styles.sheetRowSelect}
											onPress={() => props.onSelect(cat.id)}
										>
											<View style={styles.categoryRowLeft}>
												<View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
												<Text style={styles.sheetRowText}>{cat.name}</Text>
												{cat.isGoal && (
													<View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: cat.color }}>
														<Ionicons name="flag" size={10} color="#fff" />
														<Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Goal</Text>
													</View>
												)}
											</View>
											{props.selectedId === cat.id && (
												<Ionicons name="checkmark" size={20} color={Palette.brand} />
											)}
										</Pressable>
									</View>
								),
							)}
						</ScrollView>

						{props.isEditing && (
							<AddCategoryRow
								name={props.newName}
								existingColors={props.categories.map((c) => c.color)}
								onChangeName={props.onChangeNewName}
								onSubmit={(color) => props.onAdd(color)}
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
}: {
	category: Category;
	onDelete: () => void;
	onRename: (name: string) => void;
	onSetColor: (color: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draftName, setDraftName] = useState(category.name);
	const [pickerOpen, setPickerOpen] = useState(false);

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
					<Pressable onPress={() => setPickerOpen(true)} hitSlop={6} style={styles.editColorBtn}>
						<View style={[styles.categoryDot, { backgroundColor: category.color }]} />
						<View style={styles.editColorBadge}>
							<Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
						</View>
					</Pressable>
					{editing ? (
						<TextInput
							style={[styles.sheetRowText, { flex: 1 }]}
							value={draftName}
							onChangeText={setDraftName}
							autoFocus
							onBlur={commit}
							onSubmitEditing={commit}
							returnKeyType="done"
						/>
					) : (
						<Pressable onPress={() => setEditing(true)} style={{ flex: 1 }}>
							<Text style={styles.sheetRowText}>{category.name}</Text>
						</Pressable>
					)}
				</View>
				<Pressable onPress={() => setEditing(true)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
					<Ionicons name="create-outline" size={18} color={Palette.iconMuted} />
				</Pressable>
			</View>
			<ColorPickerModal
				visible={pickerOpen}
				initialColor={category.color}
				title={`Color for ${category.name}`}
				onClose={() => setPickerOpen(false)}
				onSelect={onSetColor}
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
	onSubmit: (color: string) => void;
}) {
	const [color, setColor] = useState<string>(() => pickNextCategoryColor(existingColors));
	const [pickerOpen, setPickerOpen] = useState(false);

	useEffect(() => {
		if (!existingColors.includes(color)) return;
		setColor(pickNextCategoryColor(existingColors));
	}, [existingColors, color]);

	const canAdd = name.trim().length > 0;
	const submit = () => {
		if (!canAdd) return;
		onSubmit(color);
		setColor(pickNextCategoryColor([...existingColors, color]));
	};

	return (
		<View style={styles.addRow}>
			<Pressable
				onPress={() => setPickerOpen(true)}
				hitSlop={6}
				style={styles.editColorBtn}
			>
				<View style={[styles.categoryDot, { backgroundColor: color }]} />
				<View style={styles.editColorBadge}>
					<Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
				</View>
			</Pressable>
			<TextInput
				style={styles.addInput}
				placeholder="New category name"
				placeholderTextColor={Palette.iconMuted}
				value={name}
				onChangeText={onChangeName}
				returnKeyType="done"
				onSubmitEditing={submit}
			/>
			<Pressable onPress={submit} disabled={!canAdd} hitSlop={6}>
				<Ionicons
					name="add-circle"
					size={30}
					color={canAdd ? Palette.brand : Palette.submitDisabled}
				/>
			</Pressable>
			<ColorPickerModal
				visible={pickerOpen}
				initialColor={color}
				title="Pick a color"
				onClose={() => setPickerOpen(false)}
				onSelect={setColor}
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
	const sheet = useSheetGesture(props.visible, props.onClose);
	const periodOptions: RepeatPeriod[] = ["weeks", "months"];
	const endModeOptions: RepeatEndMode[] = ["date", "count"];
	const periodLabel = (p: RepeatPeriod) =>
		props.repeat.every === 1 ? REPEAT_PERIOD_LABELS[p].singular : REPEAT_PERIOD_LABELS[p].plural;

	return (
		<Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
					<Animated.View style={[styles.sheet, sheet.animatedStyle]}>
						<Pressable onPress={() => {}}>
							<GestureDetector gesture={sheet.gesture}>
								<View style={styles.sheetGrabber}>
									<View style={styles.sheetHandle} />
									<View style={styles.sheetHeader}>
										<Pressable onPress={props.onClose} hitSlop={10}>
											<Text style={styles.sheetCancel}>Cancel</Text>
										</Pressable>
										<Text style={styles.sheetTitle}>Repeat</Text>
										<View style={styles.sheetHeaderSpacer} />
									</View>
								</View>
							</GestureDetector>

							<View style={styles.repeatBody}>
								<View style={styles.repeatToggleRow}>
									<View style={styles.rowLeft}>
										<Ionicons name="repeat" size={20} color={Palette.text} />
										<Text style={styles.rowLabel}>Repeat this transaction</Text>
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
										<Text style={styles.repeatEveryLabel}>Every</Text>
										<NumberField
											style={styles.repeatNumberInput}
											value={props.repeat.every}
											onCommit={props.onSetEvery}
											maxLength={3}
										/>
										<View style={styles.periodToggle}>
											{periodOptions.map((p) => {
												const active = props.repeat.period === p;
												return (
													<Pressable
														key={p}
														onPress={() => props.onSetPeriod(p)}
														style={[styles.periodBtn, active && styles.periodBtnActive]}
													>
														<Text
															style={[
																styles.periodText,
																active && styles.periodTextActive,
															]}
														>
															{periodLabel(p)}
														</Text>
													</Pressable>
												);
											})}
										</View>
									</View>

									<View style={styles.endModeToggle}>
										{endModeOptions.map((m) => {
											const active = props.repeat.endMode === m;
											return (
												<Pressable
													key={m}
													onPress={() => props.onSetEndMode(m)}
													style={[styles.endModeBtn, active && styles.endModeBtnActive]}
												>
													<Text
														style={[styles.endModeText, active && styles.endModeTextActive]}
													>
														{m === "date" ? "Until date" : "After N times"}
													</Text>
												</Pressable>
											);
										})}
									</View>

									{props.repeat.endMode === "date" ? (
										<View style={styles.wheelWrap}>
											<DateTimePicker
												value={props.repeat.endDate}
												mode="date"
												display="spinner"
												themeVariant="light"
												textColor={Palette.text}
												onChange={(_, d) => {
													if (d) props.onSetEndDate(d);
												}}
											/>
										</View>
									) : (
										<View style={styles.row}>
											<Text style={styles.rowLabel}>Number of occurrences</Text>
											<NumberField
												style={styles.repeatNumberInput}
												value={props.repeat.count}
												onCommit={props.onSetCount}
												maxLength={3}
											/>
										</View>
									)}

									<Text style={styles.repeatSummary}>{formatRepeatSummary(props.repeat)}</Text>
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
