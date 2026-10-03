'use client';

function renderInput(field, styling) {
  const base = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: styling.borderRadius || 12,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    background: styling.theme === 'dark' ? '#1e293b' : '#f8fafc',
    color: styling.theme === 'dark' ? '#f1f5f9' : '#0f172a',
  };

  if (field.type === 'textarea' || field.type === 'address') {
    return <textarea rows={3} placeholder={field.placeholder} style={base} readOnly />;
  }
  if (field.type === 'select') {
    return (
      <select style={base} disabled>
        <option>{field.placeholder || 'Select…'}</option>
        {(field.options || []).map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }
  if (field.type === 'radio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(field.options || ['Yes', 'No']).map((o) => (
          <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="radio" disabled /> {o}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input type="checkbox" disabled /> {field.label}
      </label>
    );
  }
  if (field.type === 'file') {
    return <div style={{ ...base, borderStyle: 'dashed', textAlign: 'center', color: '#94a3b8' }}>Drop file or browse</div>;
  }

  const inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text';
  return <input type={inputType} placeholder={field.placeholder} style={base} readOnly />;
}

export default function FormPreview({ fields, styling, meta, device = 'desktop', immersive = false }) {
  const theme = styling?.theme || 'light';
  const isDark = theme === 'dark';
  const width = device === 'mobile' ? 375 : device === 'tablet' ? 768 : immersive ? 520 : '100%';

  const bg = styling.backgroundColor || (theme === 'gradient'
    ? 'linear-gradient(135deg,#f5f3ff 0%,#eff6ff 100%)'
    : isDark ? '#0f172a' : '#ffffff');

  const wrapper = immersive ? (
    <div className="flex justify-center">
      {/* Browser chrome mockup for desktop */}
      {device === 'desktop' && (
        <div className="w-full max-w-[560px]">
          <div className="bg-muted dark:bg-slate-700 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 bg-canvas dark:bg-slate-800 rounded-md px-3 py-1 text-meta text-fg-tertiary text-center">yourwebsite.com/contact</div>
          </div>
        </div>
      )}
      {device === 'tablet' && (
        <div className="w-[480px] max-w-full bg-slate-800 rounded-[20px] p-3 shadow-modal">
          <div className="bg-slate-900 rounded-lg overflow-hidden" style={{ minHeight: 400 }}>
            {renderForm(fields, styling, meta, bg, isDark, width, device)}
          </div>
        </div>
      )}
      {device === 'mobile' && (
        <div className="w-[375px] max-w-full bg-slate-900 rounded-[32px] p-2.5 shadow-modal">
          <div className="bg-slate-800 rounded-[26px] overflow-hidden" style={{ minHeight: 520 }}>
            <div className="h-6 flex items-center justify-center">
              <div className="w-16 h-1 bg-slate-600 rounded-full" />
            </div>
            {renderForm(fields, styling, meta, bg, isDark, '100%', device)}
          </div>
        </div>
      )}
      {device === 'desktop' && renderForm(fields, styling, meta, bg, isDark, '100%', device, true)}
    </div>
  ) : (
    <div className="flex justify-center">
      {renderForm(fields, styling, meta, bg, isDark, width, device)}
    </div>
  );

  return wrapper;
}

function renderForm(fields, styling, meta, bg, isDark, width, device, roundedBottom) {
  return (
    <div
      style={{
        width,
        maxWidth: '100%',
        background: bg,
        borderRadius: roundedBottom ? `0 0 ${styling.borderRadius || 16}px ${styling.borderRadius || 16}px` : styling.borderRadius || 16,
        padding: device === 'mobile' ? 20 : 28,
        boxShadow: '0 8px 40px rgba(15,23,42,0.1)',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        color: isDark ? '#f8fafc' : '#0f172a',
      }}
    >
        {styling.logoUrl && (
          <img src={styling.logoUrl} alt="" className="h-8 mb-4 object-contain" />
        )}
        <h3 className="text-lg font-semibold mb-1">{meta?.name || 'Contact form'}</h3>
        <p className="text-sm opacity-70 mb-5">{meta?.description || 'Share your details and we will get in touch.'}</p>

        <div className="space-y-4">
          {fields.map((field) => {
            if (field.type === 'checkbox') {
              return <div key={field.name}>{renderInput(field, styling)}</div>;
            }
            return (
              <div key={field.name}>
                <label className="block text-xs font-semibold mb-1.5 opacity-80">
                  {field.label}{field.required && <span className="text-danger ml-0.5">*</span>}
                </label>
                {field.helpText && <p className="text-meta opacity-50 mb-1">{field.helpText}</p>}
                {renderInput(field, styling)}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          style={{
            width: '100%',
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: styling.borderRadius || 12,
            background: styling.primaryColor || '#2563eb',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            border: 'none',
          }}
        >
          {styling.buttonText || 'Submit'}
        </button>
        <p className="text-meta text-center opacity-40 mt-3">Powered by LeadForGrow</p>
    </div>
  );
}

export function FormPreviewThumbnail({ fields, styling }) {
  return (
    <div className="h-full w-full p-3 bg-subtle dark:bg-slate-800/50 rounded-lg overflow-hidden">
      <div className="space-y-1.5 scale-[0.85] origin-top-left">
        {(fields || []).slice(0, 4).map((f) => (
          <div key={f.name} className="h-2 rounded bg-muted dark:bg-slate-700" style={{ width: f.type === 'textarea' ? '90%' : '70%' }} />
        ))}
        <div className="h-3 w-1/2 rounded mt-2" style={{ background: styling?.primaryColor || '#2563eb', opacity: 0.8 }} />
      </div>
    </div>
  );
}
