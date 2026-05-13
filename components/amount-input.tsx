import { useRef } from 'react';
import { Pressable, StyleProp, Text, TextInput, TextStyle, ViewStyle } from 'react-native';

import { formatAmountDisplay, sanitizeAmountDigits } from '@/components/add-transaction-card.presenter';
import { isColorSchemeDark } from '@/constants/colors';
import { useAppTheme } from '@/contexts/theme-context';

type AmountInputProps = {
  digits: string;
  onChangeDigits: (digits: string) => void;
  accessoryViewId: string;
  autoFocus?: boolean;
  wrapStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
};

export function AmountInput({
  digits,
  onChangeDigits,
  accessoryViewId,
  autoFocus,
  wrapStyle,
  textStyle,
  placeholderStyle,
}: AmountInputProps) {
  const inputRef = useRef<TextInput>(null);
  const { scheme } = useAppTheme();
  const isDark = isColorSchemeDark(scheme);

  return (
    <Pressable style={wrapStyle} onPress={() => inputRef.current?.focus()}>
      <Text style={[textStyle, !digits && placeholderStyle]}>
        {formatAmountDisplay(digits)}
      </Text>
      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={(v) => onChangeDigits(sanitizeAmountDigits(v))}
        keyboardType="number-pad"
        keyboardAppearance={isDark ? 'dark' : 'light'}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        caretHidden
        maxLength={9}
        inputAccessoryViewID={accessoryViewId}
        autoFocus={autoFocus}
      />
    </Pressable>
  );
}
