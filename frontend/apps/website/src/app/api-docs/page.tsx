import { redirect } from 'next/navigation';

export default function ApiDocsRoot() {
  // Redirect /api-docs to /api-docs/introduction
  redirect('/api-docs/introduction');
  return null;
}
