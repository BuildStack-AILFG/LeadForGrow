export function getEmbedSnippets(businessId, baseUrl, position = 'right') {
  const origin = baseUrl || 'https://www.leadforgrow.com';
  return {
    script: `<!-- LeadForGrow Chatbot -->
<script>
  window.LFG_CHAT_CONFIG = {
    businessId: "${businessId}",
    position: "${position}"
  };
</script>
<script src="${origin}/chat-widget.js" async></script>`,

    iframe: `<!-- LeadForGrow Chatbot (iframe) -->
<iframe
  src="${origin}/chatbot-iframe?bizId=${businessId}&pos=${position}"
  style="position:fixed;bottom:0;${position}:0;width:420px;height:720px;border:none;z-index:999999;background:transparent;"
  allow="clipboard-read; clipboard-write"
></iframe>`,

    wordpress: `Add the script embed to your theme footer (Appearance → Theme File Editor → footer.php) or use a plugin like "Insert Headers and Footers" and paste the script code before </body>.`,
  };
}

export const COLOR_PRESETS = [
  '#0f766e', '#0369a1', '#4338ca', '#7c3aed',
  '#be123c', '#c2410c', '#15803d', '#1e293b',
];

export const WORKSPACE_TABS = [
  { id: 'customize', label: 'Customize' },
  { id: 'install', label: 'Install' },
];
