'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import InstagramAutomationBuilder from '../../components/instagram/InstagramAutomationBuilder';

function Builder({ id }) {
  const type = useSearchParams().get('type') === 'dm' ? 'dm' : 'comment';
  return <InstagramAutomationBuilder key={`${type}-${id}`} kind={type} id={id} />;
}

export default function InstagramAutomationBuilderPage({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <Builder id={id} />
    </Suspense>
  );
}
