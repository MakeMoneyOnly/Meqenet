import React from 'react';
import ApiDocsLayout from '@/widgets/api-docs/Layout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <ApiDocsLayout>{children}</ApiDocsLayout>;
}
