import React, { PropsWithChildren } from 'react';

function make(
  tag: string,
): (props: PropsWithChildren<Record<string, unknown>>) => React.JSX.Element {
  return function Component(
    _props: PropsWithChildren<Record<string, unknown>>,
  ): React.JSX.Element {
    return React.createElement(tag, _props, _props.children);
  };
}

export const Svg = make('svg');
export const Path = make('path');
export const G = make('g');
export const Circle = make('circle');
export const Rect = make('rect');
export const Line = make('line');

export default Svg;
