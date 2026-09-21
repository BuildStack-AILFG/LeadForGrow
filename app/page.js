import React from 'react';
import UserHome from './user/home/page';
import { LEGAL_NAME } from '@/lib/company';

export default function page() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'LeadForGrow',
            url: 'https://www.leadforgrow.com',
            logo: 'https://www.leadforgrow.com/logo.png',
            parentOrganization: { '@type': 'Organization', name: LEGAL_NAME, legalName: LEGAL_NAME },
          }),
        }}
      />
      <UserHome />
    </div>
  );
}
