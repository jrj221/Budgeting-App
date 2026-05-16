import { createContext, ReactNode, RefObject, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";

export type ScreenTourStep = { title: string; body: string };

export type StartTourOpts = {
	stepTargets?: (RefObject<View | null> | null)[];
	scrollRef?: RefObject<ScrollView | null>;
	onStart?: () => void;
	onDismiss?: () => void;
};

type ScreenTourContextValue = {
	steps: ScreenTourStep[] | null;
	stepIndex: number | null;
	stepTargets: (RefObject<View | null> | null)[] | null;
	scrollRef: RefObject<ScrollView | null> | null;
	startTour: (steps: ScreenTourStep[], opts?: StartTourOpts) => void;
	advance: () => void;
	dismiss: () => void;
};

const ScreenTourContext = createContext<ScreenTourContextValue | null>(null);

export function ScreenTourProvider({ children }: { children: ReactNode }) {
	const [steps, setSteps] = useState<ScreenTourStep[] | null>(null);
	const [stepIndex, setStepIndex] = useState<number | null>(null);
	const [stepTargets, setStepTargets] = useState<(RefObject<View | null> | null)[] | null>(null);
	const [scrollRef, setScrollRef] = useState<RefObject<ScrollView | null> | null>(null);

	// Stable refs so advance/dismiss closures never go stale.
	const stepsRef = useRef<ScreenTourStep[] | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const runCleanup = useCallback(() => {
		cleanupRef.current?.();
		cleanupRef.current = null;
	}, []);

	const startTour = useCallback((newSteps: ScreenTourStep[], opts?: StartTourOpts) => {
		// Clean up any in-progress tour before starting a new one.
		runCleanup();
		stepsRef.current = newSteps;
		cleanupRef.current = opts?.onDismiss ?? null;
		setSteps(newSteps);
		setStepTargets(opts?.stepTargets ?? null);
		setScrollRef(opts?.scrollRef ?? null);
		opts?.onStart?.();
		setStepIndex(0);
	}, [runCleanup]);

	const advance = useCallback(() => {
		setStepIndex((idx) => {
			if (idx === null) return null;
			const next = idx + 1;
			if (next >= (stepsRef.current?.length ?? 0)) {
				runCleanup();
				return null;
			}
			return next;
		});
	}, [runCleanup]);

	const dismiss = useCallback(() => {
		runCleanup();
		setStepIndex(null);
		setSteps(null);
		setStepTargets(null);
		setScrollRef(null);
		stepsRef.current = null;
	}, [runCleanup]);

	const value = useMemo(
		() => ({ steps, stepIndex, stepTargets, scrollRef, startTour, advance, dismiss }),
		[steps, stepIndex, stepTargets, scrollRef, startTour, advance, dismiss],
	);

	return <ScreenTourContext.Provider value={value}>{children}</ScreenTourContext.Provider>;
}

export function useScreenTour() {
	const ctx = useContext(ScreenTourContext);
	if (!ctx) throw new Error("useScreenTour must be used inside ScreenTourProvider");
	return ctx;
}
