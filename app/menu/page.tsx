import { Suspense } from 'react';
import MenuClient from '@/components/menu/MenuClient';

// Server Component — receives searchParams synchronously, no useSearchParams() needed
export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawTable = params.table;
  const tableNumber =
    typeof rawTable === 'string' && !isNaN(Number(rawTable))
      ? Number(rawTable)
      : null;

  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-surface-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/25 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <MenuClient tableNumber={tableNumber} />
    </Suspense>
  );
}
