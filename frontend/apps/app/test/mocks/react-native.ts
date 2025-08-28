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

function sanitizeProps<P extends Record<string, any>>(
  props: P,
): Record<string, any> {
  const out: Record<string, any> = {};
  const propKeys = Object.keys(props);

  for (const key of propKeys) {
    if (RN_ONLY_PROPS.has(key)) continue;
    // eslint-disable-next-line security/detect-object-injection
    out[key] = props[key];
  }
  return out;
}

// Basic component factory with ref support and prop filtering
function createElement<T extends object = any>(
  tag: keyof JSX.IntrinsicElements,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<PropsWithChildren<T & { testID?: string }>> &
    React.RefAttributes<any>
> {
  const Component = React.forwardRef<
    any,
    PropsWithChildren<T & { testID?: string }>
  >((props, ref) => {
    const { children, testID, ...rest } = props as any;
    const sanitized = sanitizeProps(rest);
    const domProps = {
      ...sanitized,
      ref,
      ...(testID ? { 'data-testid': testID } : {}),
    } as Record<string, any>;
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
  const { children, onPress, testID, ...rest } = props as any;
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
  const { children, title, onPress, testID, ...rest } = props as any;
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

export default {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Button,
  StyleSheet,
  Linking,
  Platform,
};
