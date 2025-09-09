import React from 'react';
import ApiDocsLayout from '@/components/ApiDocs/Layout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <ApiDocsLayout>{children}</ApiDocsLayout>;
}
