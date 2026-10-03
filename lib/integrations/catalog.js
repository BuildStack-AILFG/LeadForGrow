/**
 * Enterprise integration catalog — field schemas, auth types, webhook paths.
 */

export const INTEGRATION_STATUSES = ['connected', 'disconnected', 'expired', 'needs_reauth', 'sync_failed', 'rate_limited'];
export const HEALTH_STATUSES = ['healthy', 'warning', 'error', 'unknown'];

export const INTEGRATION_CATALOG = [
  {
    id: 'whatsapp-cloud',
    name: 'WhatsApp Cloud API',
    category: 'communication',
    description: 'Official Meta WhatsApp Business Cloud API for two-way messaging and templates.',
    color: 'emerald',
    initials: 'WA',
    authType: 'api_key',
    legacyKey: 'whatsapp',
    legacyProvider: 'meta',
    fields: [
      { key: 'appId', label: 'Meta App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true, secret: true },
      { key: 'accessToken', label: 'Permanent Access Token', type: 'password', required: true, secret: true },
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'businessAccountId', label: 'WhatsApp Business Account ID', type: 'text', required: true },
      { key: 'verifyToken', label: 'Webhook Verify Token', type: 'text', required: true, secret: true }
    ],
    webhookPath: '/api/webhooks/meta/{businessId}',
    features: ['Two-way chat', 'Template messages', 'Webhook events']
  },
  {
    id: 'interakt',
    name: 'Interakt',
    category: 'communication',
    description: 'WhatsApp BSP for Indian businesses.',
    color: 'violet',
    initials: 'IN',
    authType: 'api_key',
    legacyKey: 'whatsapp',
    legacyProvider: 'interakt',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, secret: true },
      { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: true },
      { key: 'whatsappNumber', label: 'WhatsApp Number', type: 'text', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false, secret: true }
    ],
    webhookPath: '/api/integrations/webhooks/interakt-reply?businessId={businessId}',
    features: ['Broadcasts', 'Inbox sync']
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'communication',
    description: 'SMS, voice, and WhatsApp via Twilio.',
    color: 'red',
    initials: 'TW',
    authType: 'api_key',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true, secret: true },
      { key: 'whatsappNumber', label: 'WhatsApp Number', type: 'text', required: true },
      { key: 'messagingServiceSid', label: 'Messaging Service SID', type: 'text', required: false }
    ],
    features: ['SMS', 'Voice', 'WhatsApp']
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'communication',
    description: 'Sync Gmail and send follow-ups from CRM.',
    color: 'rose',
    initials: 'GM',
    authType: 'oauth',
    oauthProvider: 'google',
    fields: [{ key: 'connectedEmail', label: 'Connected Email', type: 'email', readOnly: true }],
    features: ['Email sync', 'Send mail']
  },
  {
    id: 'hostinger-smtp',
    name: 'Hostinger Email (SMTP)',
    category: 'communication',
    description:
      'Send transactional & welcome emails from your own Hostinger mailbox via SMTP.',
    color: 'amber',
    initials: 'HS',
    authType: 'api_key',
    legacyKey: 'email',
    legacyProvider: 'smtp',
    fields: [
      { key: 'username', label: 'Mailbox Username (login email)', type: 'email', required: true },
      { key: 'password', label: 'Mailbox Password', type: 'password', required: true, secret: true },
      {
        key: 'host',
        label: 'SMTP Host',
        type: 'text',
        required: false,
        placeholder: 'smtp.hostinger.com',
      },
      { key: 'port', label: 'SMTP Port', type: 'text', required: false, placeholder: '465' },
      { key: 'fromEmail', label: 'Send From (email)', type: 'email', required: false },
      { key: 'fromName', label: 'Sender Name', type: 'text', required: false },
    ],
    features: ['Welcome emails', 'Meeting confirmations', 'Automated reminders'],
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'communication',
    description: 'Microsoft 365 email integration.',
    color: 'blue',
    initials: 'OL',
    authType: 'oauth',
    oauthProvider: 'microsoft',
    fields: [
      { key: 'clientId', label: 'Microsoft Client ID', type: 'text', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, secret: true }
    ],
    features: ['Outlook sync']
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Lead alerts in Slack channels.',
    color: 'purple',
    initials: 'SL',
    authType: 'api_key',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, secret: true },
      { key: 'workspaceName', label: 'Workspace Name', type: 'text', required: true },
      { key: 'channelId', label: 'Channel ID', type: 'text', required: true },
      { key: 'signingSecret', label: 'Signing Secret', type: 'password', required: true, secret: true }
    ],
    features: ['Lead alerts']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'communication',
    description: 'Schedule Zoom meetings from leads.',
    color: 'blue',
    initials: 'ZM',
    authType: 'oauth',
    oauthProvider: 'zoom',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, secret: true },
      { key: 'accountId', label: 'Account ID', type: 'text', required: true }
    ],
    features: ['Meetings']
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    category: 'marketing',
    description: 'Facebook & Instagram Lead Ads sync.',
    color: 'blue',
    initials: 'FB',
    authType: 'api_key',
    legacyKey: 'facebookAds',
    fields: [
      { key: 'appId', label: 'Meta App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true, secret: true },
      { key: 'accessToken', label: 'Page Access Token', type: 'password', required: true, secret: true },
      { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true },
      { key: 'pageId', label: 'Page ID', type: 'text', required: true },
      { key: 'verifyToken', label: 'Webhook Verify Token', type: 'password', required: true, secret: true }
    ],
    webhookPath: '/api/webhooks/meta/{businessId}',
    features: ['Lead form sync']
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    category: 'marketing',
    description: 'Google Ads lead form extensions.',
    color: 'amber',
    initials: 'GA',
    authType: 'oauth',
    oauthProvider: 'google',
    fields: [
      { key: 'developerToken', label: 'Developer Token', type: 'password', required: true, secret: true },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, secret: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true, secret: true },
      { key: 'customerId', label: 'Customer ID', type: 'text', required: true }
    ],
    features: ['Lead import']
  },
  {
    id: 'linkedin-ads',
    name: 'LinkedIn Ads',
    category: 'marketing',
    description: 'LinkedIn Lead Gen Forms.',
    color: 'blue',
    initials: 'LI',
    authType: 'oauth',
    oauthProvider: 'linkedin',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, secret: true },
      { key: 'organizationId', label: 'Organization ID', type: 'text', required: true }
    ],
    features: ['Lead gen']
  },
  {
    id: 'tiktok-ads',
    name: 'TikTok Ads',
    category: 'marketing',
    description: 'TikTok Lead Generation.',
    color: 'slate',
    initials: 'TT',
    authType: 'oauth',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true, secret: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, secret: true },
      { key: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }
    ],
    features: ['Instant forms']
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'payments',
    description: 'Payment tracking in CRM.',
    color: 'blue',
    initials: 'RZ',
    authType: 'api_key',
    fields: [
      { key: 'keyId', label: 'Key ID', type: 'text', required: true },
      { key: 'keySecret', label: 'Key Secret', type: 'password', required: true, secret: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true, secret: true }
    ],
    features: ['Payments']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Stripe payments and subscriptions.',
    color: 'indigo',
    initials: 'ST',
    authType: 'api_key',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, secret: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true, secret: true }
    ],
    features: ['Checkout']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    description: 'PayPal payment sync.',
    color: 'blue',
    initials: 'PP',
    authType: 'api_key',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Secret', type: 'password', required: true, secret: true },
      { key: 'environment', label: 'Environment', type: 'select', required: true, options: ['sandbox', 'live'], default: 'sandbox' }
    ],
    features: ['Payments']
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    description: 'Shopify order and customer sync.',
    color: 'emerald',
    initials: 'SH',
    authType: 'api_key',
    fields: [
      { key: 'storeUrl', label: 'Store URL', type: 'url', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, secret: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: false, secret: true }
    ],
    features: ['Orders']
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    description: 'WooCommerce store integration.',
    color: 'purple',
    initials: 'WC',
    authType: 'api_key',
    fields: [
      { key: 'storeUrl', label: 'Store URL', type: 'url', required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true, secret: true }
    ],
    features: ['Orders']
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'automation',
    description: 'Zapier automation workflows.',
    color: 'orange',
    initials: 'ZP',
    authType: 'webhook',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true },
      { key: 'zapName', label: 'Zap Name', type: 'text', required: false }
    ],
    features: ['Zaps']
  },
  {
    id: 'pabbly',
    name: 'Pabbly Connect',
    category: 'automation',
    description: 'Pabbly automation.',
    color: 'green',
    initials: 'PB',
    authType: 'webhook',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: false, secret: true }
    ],
    features: ['Workflows']
  },
  {
    id: 'make',
    name: 'Make.com',
    category: 'automation',
    description: 'Make.com scenarios.',
    color: 'violet',
    initials: 'MK',
    authType: 'webhook',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true },
      { key: 'scenarioName', label: 'Scenario Name', type: 'text', required: false }
    ],
    features: ['Scenarios']
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    category: 'automation',
    description: 'Inbound/outbound webhook events.',
    color: 'slate',
    initials: 'WH',
    authType: 'webhook',
    usesBusinessWebhookSecret: true,
    fields: [
      { key: 'endpointUrl', label: 'Outbound Endpoint URL', type: 'url', required: false },
      { key: 'secretKey', label: 'Signing Secret', type: 'password', required: false, secret: true },
      { key: 'eventTypes', label: 'Event Types', type: 'text', required: false, placeholder: 'lead.created,lead.updated' },
      { key: 'maxRetries', label: 'Max Retries', type: 'number', default: 3 }
    ],
    webhookPath: '/api/integrations/webhooks/{webhookSecret}',
    features: ['Inbound', 'Outbound']
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'meetings',
    description: 'Meeting booking sync.',
    color: 'blue',
    initials: 'CL',
    authType: 'api_key',
    fields: [
      { key: 'personalAccessToken', label: 'Personal Access Token', type: 'password', required: true, secret: true },
      { key: 'organizationUri', label: 'Organization URI', type: 'text', required: false }
    ],
    features: ['Meetings']
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'meetings',
    description: 'Google Calendar sync.',
    color: 'amber',
    initials: 'GC',
    authType: 'oauth',
    oauthProvider: 'google',
    fields: [{ key: 'connectedEmail', label: 'Connected Account', type: 'email', readOnly: true }],
    features: ['Calendar sync']
  },
  {
    id: 'hubspot-import',
    name: 'HubSpot Import',
    category: 'crm-imports',
    description: 'Import from HubSpot CRM.',
    color: 'orange',
    initials: 'HS',
    authType: 'hybrid',
    fields: [
      { key: 'authMethod', label: 'Auth Method', type: 'select', required: true, options: ['api_key', 'oauth'], default: 'api_key' },
      { key: 'apiKey', label: 'Private App API Key', type: 'password', required: false, secret: true },
      { key: 'portalId', label: 'Portal ID', type: 'text', required: true }
    ],
    features: ['Import']
  },
  {
    id: 'zoho-import',
    name: 'Zoho CRM Import',
    category: 'crm-imports',
    description: 'Import from Zoho CRM.',
    color: 'red',
    initials: 'ZO',
    authType: 'oauth',
    oauthProvider: 'zoho',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, secret: true },
      { key: 'organizationId', label: 'Organization ID', type: 'text', required: true }
    ],
    features: ['Import']
  },
  {
    id: 'salesforce-import',
    name: 'Salesforce Import',
    category: 'crm-imports',
    description: 'Import from Salesforce.',
    color: 'blue',
    initials: 'SF',
    authType: 'oauth',
    oauthProvider: 'salesforce',
    fields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', required: true },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, secret: true },
      { key: 'securityToken', label: 'Security Token', type: 'password', required: false, secret: true }
    ],
    features: ['Import']
  }
];

export function getCatalogEntry(integrationId) {
  return INTEGRATION_CATALOG.find((i) => i.id === integrationId) || null;
}

export function getSecretFieldKeys(integrationId) {
  const entry = getCatalogEntry(integrationId);
  if (!entry) return [];
  return entry.fields.filter((f) => f.secret).map((f) => f.key);
}

export function validateCredentials(integrationId, credentials = {}) {
  const entry = getCatalogEntry(integrationId);
  if (!entry) return { valid: false, errors: ['Unknown integration'] };

  const errors = [];
  for (const field of entry.fields) {
    if (field.readOnly) continue;
    if (field.required && !String(credentials[field.key] ?? '').trim()) {
      errors.push(`${field.label} is required`);
    }
  }

  if (entry.id === 'hubspot-import') {
    const method = credentials.authMethod || 'api_key';
    if (method === 'api_key' && !String(credentials.apiKey ?? '').trim()) {
      errors.push('API Key is required for API key auth');
    }
  }

  return { valid: errors.length === 0, errors };
}
