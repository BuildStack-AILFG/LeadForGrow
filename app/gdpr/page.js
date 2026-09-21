import LegalPageLayout, { LegalSection } from '@/app/components/marketing/LegalPage';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { LEGAL_NAME, PRODUCT_STATEMENT } from '@/lib/company';

export const metadata = { title: 'GDPR & Data Protection | LeadForGrow', description: 'How ScaleDesk Technology Private Limited handles personal data for the LeadForGrow platform.' };

export default function GDPRPage() {
  return (
    <LegalPageLayout title="GDPR & Data Protection" lastUpdated="September 2026" showCompanyInfo={false}>
      <LegalSection title="Data controller">
        <p>{LEGAL_NAME}, which operates LeadForGrow, is the data controller for account and platform data. Customer data processed on behalf of users is handled as a data processor.</p>
        <p>{PRODUCT_STATEMENT}</p>
        <CompanyAddress variant="full" />
      </LegalSection>
      <LegalSection title="Your rights">
        <p>Under GDPR you have the right to access, rectify, erase, restrict processing, data portability, and object to processing. Contact privacy@leadforgrow.com to exercise these rights.</p>
      </LegalSection>
      <LegalSection title="Data processing">
        <p>We aim to process personal data responsibly and in accordance with applicable data protection laws. We process data only for providing the service, improving the platform, and legal compliance. Sub-processors are listed in our DPA.</p>
      </LegalSection>
      <LegalSection title="International transfers">
        <p>Data may be processed in India and other regions where our infrastructure providers operate, with appropriate safeguards in place.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
