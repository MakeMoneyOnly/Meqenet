import React, { PropsWithChildren } from 'react';

// Basic component factory
function createElement<T extends object = any>(
  tag: string,
): (props: PropsWithChildren<T>) => React.JSX.Element {
  return function Component(props: PropsWithChildren<T>): React.JSX.Element {
    return React.createElement(tag, props, props.children);
  };
}

export const View = createElement('div');
export const Text = createElement('span');
export const SafeAreaView = createElement('div');
export const ScrollView = createElement('div');
export const StatusBar = createElement('div');
export const TouchableOpacity = (
  props: PropsWithChildren<
    React.HTMLAttributes<HTMLButtonElement> & { onPress?: () => void }
  >,
): React.JSX.Element => {
  const { children, onPress, ...rest } = props;
  return React.createElement('button', { onClick: onPress, ...rest }, children);
};
export const Button = (
  props: PropsWithChildren<
    {
      title?: string;
      onPress?: () => void;
    } & React.ButtonHTMLAttributes<HTMLButtonElement>
  >,
): React.JSX.Element => {
  const { children, title, onPress, ...rest } = props;
  // Map RN's onPress to web's onClick so testing-library's click works
  const onClick = onPress ?? (rest as any).onClick;
  return React.createElement(
    'button',
    { ...rest, onClick },
    children ?? title ?? 'Button',
  );
};

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
