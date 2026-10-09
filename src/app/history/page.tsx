import type { Metadata } from 'next';
import EquiPayApp from '@/components/EquiPayApp';

export const metadata: Metadata = {
  title: 'Lịch sử chốt sổ | EquiPay',
};

export default function HistoryPage() {
  return <EquiPayApp view="history" />;
}
