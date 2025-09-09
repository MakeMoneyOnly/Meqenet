import React from 'react';
import ScrollBlurItem from './ScrollBlurItem';

// List of tag names to blur - expanded to include more elements
const BLUR_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'span',
  'li',
  'img',
  'Image',
  'a',
  'button',
  'div',
  'section',
  'article',
  'nav',
  'aside',
  'main',
  'time',
  'small',
  'strong',
  'em',
  'mark',
  'del',
  'ins',
  'sub',
  'sup',
];

// List of class substrings to exclude (e.g., cards) - reduced exclusions
const EXCLUDE_CLASSES = [
  'fixed',
  'absolute',
  'sticky',
  'z-50',
  'z-40',
  'backdrop',
  'overlay',
];

// Type for React element props that might have children and className
interface ElementProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Recursively wraps all text and image elements with ScrollBlurItem for premium effect.
 * Skips card-like/container elements.
 */
export function wrapWithScrollBlurItem(
  children: React.ReactNode,
): React.ReactNode {
  if (!children) return null;
  if (Array.isArray(children)) {
    return children.map((child) => wrapWithScrollBlurItem(child));
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return <ScrollBlurItem>{children}</ScrollBlurItem>;
  }
  if (React.isValidElement<ElementProps>(children)) {
    // Safely extract component name
    const getComponentName = (
      type: string | React.JSXElementConstructor<unknown>,
    ): string => {
      if (typeof type === 'string') return type;
      return (
        (type as { displayName?: string; name?: string }).displayName ||
        (type as { displayName?: string; name?: string }).name ||
        'Unknown'
      );
    };

    const tag = getComponentName(children.type);
    const className = children.props?.className || '';
    // Exclude cards/containers
    if (EXCLUDE_CLASSES.some((cls) => className.includes(cls))) {
      return React.cloneElement(children, {
        children: children.props?.children
          ? wrapWithScrollBlurItem(children.props.children)
          : children.props?.children,
      } as Partial<ElementProps>);
    }
    // Only wrap if tag is in BLUR_TAGS
    if (BLUR_TAGS.includes(tag)) {
      return (
        <ScrollBlurItem>
          {children.props?.children
            ? React.cloneElement(children, {
                children: wrapWithScrollBlurItem(children.props.children),
              } as Partial<ElementProps>)
            : children}
        </ScrollBlurItem>
      );
    }
    // Otherwise, recurse
    return React.cloneElement(children, {
      children: children.props?.children
        ? wrapWithScrollBlurItem(children.props.children)
        : children.props?.children,
    } as Partial<ElementProps>);
  }
  return children;
}
