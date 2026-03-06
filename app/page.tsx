import { getFallbackLocale } from '@/app/i18n/settings';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const locale = await getFallbackLocale();
  redirect(`/${locale}`);
}
