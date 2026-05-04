import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useRef } from "react";
import {
	Keyboard,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
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
	MODE_LABELS,
	submitButtonLabel,
	Transaction,
	TransactionMode,
} from "@/components/add-transaction-card.presenter";
import { useAddTransactionCard } from "@/hooks/use-add-transaction-card";

const VENMO_BLUE = "#3D95CE";
const SPENT_RED = "#e53935";
const EARNED_GREEN = "#22a06b";
const MUTED = "#9aa0a6";
const SURFACE = "#f7f8fa";
const BORDER = "#e6e8eb";
const TEXT = "#11181C";

const MODE_COLORS: Record<TransactionMode, string> = {
	spent: SPENT_RED,
	earned: EARNED_GREEN,
};

export type AddTransactionCardProps = {
	onSubmit?: (transaction: Transaction) => void;
};

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
				/>
			</Pressable>

			<TextInput
				style={styles.titleInput}
				placeholder="What's it for?"
				placeholderTextColor={MUTED}
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
					<Ionicons name="calendar-outline" size={20} color={TEXT} />
					<Text style={styles.rowLabel}>Date</Text>
				</View>
				<View style={styles.rowRight}>
					<Text style={styles.rowValue}>{formatDateLabel(presenter.draft.date)}</Text>
					<Ionicons
						name={presenter.isDatePickerOpen ? "chevron-up" : "chevron-down"}
						size={18}
						color={MUTED}
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
						textColor={TEXT}
						onChange={(_, d) => {
							if (d) presenter.setDate(d);
						}}
					/>
				</View>
			)}

			<Pressable
				style={styles.row}
				onPress={() => {
					Keyboard.dismiss();
					presenter.openCategorySheet();
				}}
			>
				<View style={styles.rowLeft}>
					<Ionicons name="pricetag-outline" size={20} color={TEXT} />
					<Text style={styles.rowLabel}>Category</Text>
				</View>
				<View style={styles.rowRight}>
					<Text style={[styles.rowValue, !presenter.selectedCategory && styles.rowValueMuted]}>
						{presenter.selectedCategory?.name ?? "None"}
					</Text>
					<Ionicons name="chevron-forward" size={18} color={MUTED} />
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
			/>
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
							active && { backgroundColor: MODE_COLORS[m] },
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
	onAdd: () => void;
};

function CategorySheet(props: CategorySheetProps) {
	const { height: windowHeight } = useWindowDimensions();
	const listMaxHeight = windowHeight * 0.5;
	const translateY = useSharedValue(0);
	const baseY = useSharedValue(0);

	useEffect(() => {
		if (props.visible) {
			translateY.value = 0;
			baseY.value = 0;
		}
	}, [props.visible, translateY, baseY]);

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			translateY.value = baseY.value + e.translationY;
		})
		.onEnd((e) => {
			const finalY = baseY.value + e.translationY;
			if (finalY > 120 || e.velocityY > 800) {
				baseY.value = 0;
				translateY.value = withTiming(0, { duration: 180 });
				runOnJS(props.onClose)();
			} else if (finalY < 0) {
				baseY.value = 0;
				translateY.value = withTiming(0, { duration: 180 });
			} else {
				baseY.value = finalY;
				translateY.value = finalY;
			}
		});

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
			<Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
				<Animated.View style={[styles.sheet, sheetStyle]}>
					<Pressable onPress={() => {}}>
						<GestureDetector gesture={pan}>
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
								showsVerticalScrollIndicator={false}>
								{!props.isEditing && (
									<Pressable style={styles.sheetRow} onPress={() => props.onSelect(null)}>
										<View style={styles.sheetRowSelect}>
											<Text style={[styles.sheetRowText, styles.sheetRowMuted]}>None</Text>
											{props.selectedId === null && (
												<Ionicons name="checkmark" size={20} color={VENMO_BLUE} />
											)}
										</View>
									</Pressable>
								)}

								{props.categories.map((cat) => (
									<View key={cat.id} style={styles.sheetRow}>
										{props.isEditing && (
											<Pressable
												onPress={() => props.onDelete(cat.id)}
												style={styles.deleteBtn}
												hitSlop={8}
											>
												<Ionicons name="remove-circle" size={22} color="#e53935" />
											</Pressable>
										)}
										<Pressable
											style={styles.sheetRowSelect}
											onPress={() => !props.isEditing && props.onSelect(cat.id)}
											disabled={props.isEditing}
										>
											<Text style={styles.sheetRowText}>{cat.name}</Text>
											{props.selectedId === cat.id && !props.isEditing && (
												<Ionicons name="checkmark" size={20} color={VENMO_BLUE} />
											)}
										</Pressable>
									</View>
								))}
							</ScrollView>

							{props.isEditing && (
								<View style={styles.addRow}>
									<TextInput
										style={styles.addInput}
										placeholder="New category name"
										placeholderTextColor={MUTED}
										value={props.newName}
										onChangeText={props.onChangeNewName}
										returnKeyType="done"
										onSubmitEditing={props.onAdd}
									/>
									<Pressable onPress={props.onAdd} hitSlop={6}>
										<Ionicons name="add-circle" size={30} color={VENMO_BLUE} />
									</Pressable>
								</View>
							)}
						</Pressable>
					</Animated.View>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#fff",
		borderRadius: 24,
		padding: 20,
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 16,
		elevation: 4,
		gap: 14,
	},
	toggle: {
		flexDirection: "row",
		backgroundColor: "#f1f3f5",
		borderRadius: 999,
		padding: 4,
	},
	toggleBtn: {
		flex: 1,
		paddingVertical: 10,
		alignItems: "center",
		borderRadius: 999,
	},
	toggleBtnActive: {
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	toggleText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#777",
	},
	toggleTextActive: {
		color: "#fff",
	},
	amountWrap: {
		alignItems: "center",
		paddingVertical: 8,
	},
	amount: {
		fontSize: 56,
		fontWeight: "700",
		color: TEXT,
		letterSpacing: -1,
	},
	amountMuted: {
		color: "#c4c8cc",
	},
	hiddenInput: {
		position: "absolute",
		opacity: 0,
		height: 1,
		width: 1,
	},
	titleInput: {
		fontSize: 17,
		fontWeight: "500",
		color: TEXT,
		paddingVertical: 14,
		paddingHorizontal: 16,
		backgroundColor: SURFACE,
		borderRadius: 14,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 16,
		backgroundColor: SURFACE,
		borderRadius: 14,
	},
	rowLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	rowRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	rowLabel: {
		fontSize: 16,
		fontWeight: "500",
		color: TEXT,
	},
	rowValue: {
		fontSize: 16,
		color: TEXT,
	},
	rowValueMuted: {
		color: MUTED,
	},
	wheelWrap: {
		backgroundColor: "#fff",
		borderRadius: 14,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: BORDER,
		overflow: "hidden",
	},
	submit: {
		backgroundColor: VENMO_BLUE,
		paddingVertical: 16,
		borderRadius: 999,
		alignItems: "center",
		marginTop: 4,
	},
	submitDisabled: {
		backgroundColor: "#cfd8dc",
	},
	submitText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},
	sheetBackdrop: {
		flex: 1,
		backgroundColor: "transparent",
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 540,
		marginBottom: -500,
	},
	sheetGrabber: {
		paddingVertical: 4,
	},
	sheetHandle: {
		alignSelf: "center",
		width: 36,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#d0d4d9",
		marginBottom: 8,
	},
	sheetHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingBottom: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: BORDER,
		marginBottom: 4,
	},
	sheetTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: TEXT,
	},
	sheetCancel: {
		fontSize: 16,
		color: TEXT,
	},
	sheetEdit: {
		fontSize: 16,
		color: VENMO_BLUE,
		fontWeight: "600",
	},
	sheetRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		gap: 12,
	},
	sheetRowSelect: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	sheetRowText: {
		fontSize: 17,
		color: TEXT,
	},
	sheetRowMuted: {
		color: MUTED,
	},
	deleteBtn: {
		paddingHorizontal: 2,
	},
	addRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: BORDER,
		marginTop: 4,
	},
	addInput: {
		flex: 1,
		backgroundColor: SURFACE,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
		color: TEXT,
	},
});
