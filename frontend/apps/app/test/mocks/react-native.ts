import React, { PropsWithChildren, type JSX } from 'react';

// Strip RN-only props that aren't valid DOM attributes and map testing props
const RN_ONLY_PROPS = new Set<string>([
  // common RN props
  'testID',
  'nativeID',
  'onLayout',
  'pointerEvents',
  'collapsable',
  'needsOffscreenAlphaCompositing',
  'renderToHardwareTextureAndroid',
  'shouldRasterizeIOS',
  // Text-specific
  'numberOfLines',
  'ellipsizeMode',
  'allowFontScaling',
  'adjustsFontSizeToFit',
  'minimumFontScale',
  'suppressHighlighting',
  // StatusBar
  'barStyle',
  // ScrollView/SafeAreaView
  'contentInsetAdjustmentBehavior',
  // Accessibility (React handles aria-*)
  'accessible',
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'accessibilityState',
  'accessibilityActions',
  'onAccessibilityAction',
  'onAccessibilityEscape',
  'onAccessibilityTap',
  'onMagicTap',
]);

function sanitizeProps<P extends Record<string, unknown>>(
  props: P,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const propKeys = Object.keys(props);

  for (const key of propKeys) {
    if (RN_ONLY_PROPS.has(key)) continue;

    out[key] = props[key];
  }
  return out;
}

// Basic component factory with ref support and prop filtering
function createElement<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  tag: keyof JSX.IntrinsicElements,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<PropsWithChildren<T & { testID?: string }>> &
    React.RefAttributes<unknown>
> {
  const Component = React.forwardRef<
    unknown,
    PropsWithChildren<T & { testID?: string }>
  >((props, ref) => {
    const { children, testID, ...rest } = props as PropsWithChildren<
      T & { testID?: string }
    >;
    const sanitized = sanitizeProps(rest);
    const domProps = {
      ...sanitized,
      ref,
      ...(testID ? { 'data-testid': testID } : {}),
    } as Record<string, unknown>;
    return React.createElement(tag, domProps, children);
  });
  Component.displayName = `createElement(${String(tag)})`;
  return Component;
}

export const View = createElement('div');
View.displayName = 'View';

export const Text = createElement('span');
Text.displayName = 'Text';

export const SafeAreaView = createElement('div');
SafeAreaView.displayName = 'SafeAreaView';

export const ScrollView = createElement('div');
ScrollView.displayName = 'ScrollView';

export const StatusBar = createElement('div');
StatusBar.displayName = 'StatusBar';
export const TouchableOpacity = React.forwardRef<
  HTMLButtonElement,
  PropsWithChildren<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      onPress?: () => void;
      testID?: string;
    }
  >
>((props, ref) => {
  const { children, onPress, testID, ...rest } = props;
  const sanitized = sanitizeProps(rest);
  return React.createElement(
    'button',
    {
      ...sanitized,
      ref,
      onClick: onPress,
      type: 'button',
      ...(testID ? { 'data-testid': testID } : {}),
    },
    children,
  );
});
TouchableOpacity.displayName = 'TouchableOpacity';

export const Button = React.forwardRef<
  HTMLButtonElement,
  PropsWithChildren<
    {
      title?: string;
      onPress?: () => void;
      testID?: string;
    } & React.ButtonHTMLAttributes<HTMLButtonElement>
  >
>((props, ref) => {
  const { children, title, onPress, testID, ...rest } = props;
  const sanitized = sanitizeProps(rest);
  const content = children ?? title ?? 'Button';
  return React.createElement(
    'button',
    {
      ...sanitized,
      ref,
      onClick: onPress,
      type: 'button',
      ...(testID ? { 'data-testid': testID } : {}),
    },
    content,
  );
});
Button.displayName = 'Button';

export const StyleSheet = {
  create<T extends object>(styles: T): T {
    return styles;
  },
};

export const Linking = {
  async openURL(url: string): Promise<string> {
    // no-op mock
    return Promise.resolve(url);
  },
};

export const Platform = {
  OS: 'test',
  select<T>(obj: { ios?: T; android?: T; default?: T }): T | undefined {
    return obj.default ?? obj.ios ?? obj.android;
  },
};

export const ActivityIndicator = React.forwardRef<
  HTMLDivElement,
  PropsWithChildren<{
    size?: 'small' | 'large';
    color?: string;
    testID?: string;
  }>
>((props, ref) => {
  const { size = 'small', color = '#000', testID, ...rest } = props;
  const sanitized = sanitizeProps(rest);
  return React.createElement('div', {
    ...sanitized,
    ref,
    style: {
      width: size === 'large' ? '36px' : '20px',
      height: size === 'large' ? '36px' : '20px',
      borderRadius: '50%',
      border: `2px solid ${color}`,
      borderTopColor: 'transparent',
      animation: 'spin 1s linear infinite',
      ...((rest.style as Record<string, unknown>) || {}),
    },
    ...(testID ? { 'data-testid': testID } : {}),
  });
});
ActivityIndicator.displayName = 'ActivityIndicator';

export const TextInput = React.forwardRef<
  HTMLInputElement,
  PropsWithChildren<
    {
      placeholder?: string;
      value?: string;
      onChangeText?: (text: string) => void;
      secureTextEntry?: boolean;
      placeholderTextColor?: string;
      multiline?: boolean;
      numberOfLines?: number;
      testID?: string;
    } & React.InputHTMLAttributes<HTMLInputElement>
  >
>((props, ref) => {
  const {
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    placeholderTextColor,
    multiline,
    numberOfLines,
    testID,
    ...rest
  } = props;
  const sanitized = sanitizeProps(rest);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChangeText?.(e.target.value);
  };

  const inputProps = {
    ...sanitized,
    ref: ref as React.Ref<HTMLInputElement>,
    placeholder,
    value,
    onChange: handleChange,
    type: secureTextEntry ? 'password' : 'text',
    ...(testID ? { 'data-testid': testID } : {}),
    ...(placeholderTextColor
      ? {
          style: {
            ...((rest.style as Record<string, unknown>) || {}),
            '--placeholder-color': placeholderTextColor,
          } as React.CSSProperties,
        }
      : {}),
  };

  if (multiline) {
    return React.createElement('textarea', {
      ...inputProps,
      ref: ref as React.Ref<HTMLTextAreaElement>,
      rows: numberOfLines || 4,
    });
  }

  return React.createElement('input', inputProps);
});
TextInput.displayName = 'TextInput';

export default {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Button,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Linking,
  Platform,
};
