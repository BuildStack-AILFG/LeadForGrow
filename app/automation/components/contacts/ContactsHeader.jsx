'use client';

import CrmPageHeader from '../crm/CrmPageHeader';

export default function ContactsHeader({ onCreate, ...props }) {
  return (
    <CrmPageHeader
      title="Contacts"
      subtitle="People you work with."
      searchPlaceholder="Search name, email, phone, company"
      primaryLabel="Add contact"
      totalLabel="contacts"
      onPrimaryClick={onCreate}
      {...props}
    />
  );
}
