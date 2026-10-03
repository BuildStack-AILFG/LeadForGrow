import { redirect } from 'next/navigation';

/** The media kit now lives on the Press page. */
export default function MediaKitPage() {
  redirect('/press#brand-assets');
}
