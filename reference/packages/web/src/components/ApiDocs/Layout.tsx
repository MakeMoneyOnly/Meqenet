import ApiDocsHeader from './Header';
import ApiDocsSidebar from './Sidebar';
import DocsTabs from './DocsTabs';

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-aeonik" id="api-docs-root">
      {/* id used for strict font enforcement via globals.css */}
      <ApiDocsHeader />
      <div className="flex-1 flex justify-center w-full">
        <div className="max-w-6xl w-full flex flex-col mx-auto pt-20 pb-32 px-4">
          <DocsTabs />
          <div className="flex gap-8 mt-6">
            <ApiDocsSidebar />
            <main className="flex-1 p-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 min-h-[70vh]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
