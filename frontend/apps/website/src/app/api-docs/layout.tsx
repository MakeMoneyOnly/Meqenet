import React from 'react';
import ApiDocsLayout from '@/components/ApiDocs/Layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ApiDocsLayout>{children}</ApiDocsLayout>;
}
