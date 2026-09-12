import mongoose from 'mongoose';

const ButtonSchema = new mongoose.Schema({
  type: { type: String, enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'], required: true },
  text: { type: String, required: true, maxlength: 25 },
  url: String,
  phone_number: String,
  example: [String],
}, { _id: false });

const ComponentSchema = new mongoose.Schema({
  type: { type: String, enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'], required: true },
  format: { type: String, enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] },
  text: String,
  example: {
    header_text: [String],
    body_text: [[String]],
    header_handle: [String],
    header_filename: String,
    // Public URL where the same media is hosted — reusable at send time
    // because Meta's Resumable Upload handle can only be used for review.
    header_media_url: String,
  },
  buttons: [ButtonSchema],
}, { _id: false });

const WhatsAppTemplateSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_]+$/, 'Name must be lowercase letters, numbers, and underscores only'],
    maxlength: 512,
  },
  language: { type: String, default: 'en_US', required: true },
  category: {
    type: String,
    enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
    required: true,
    default: 'MARKETING',
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED', 'PAUSED'],
    default: 'DRAFT',
    index: true,
  },
  // Soft delete — templates move to the "Deleted" tab instead of being
  // destroyed outright, so they can be restored. The Meta-side template
  // (if any) is still hard-deleted via the Graph API when this is set.
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date,
  components: { type: [ComponentSchema], default: [] },

  metaTemplateId: { type: String, index: true, sparse: true },
  metaStatus: String,
  metaRejectionReason: String,
  metaCategoryChangedTo: String,
  metaSubmittedAt: Date,
  metaLastCheckedAt: Date,
  source: { type: String, enum: ['native', 'imported'], default: 'native' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

WhatsAppTemplateSchema.index({ businessId: 1, name: 1, language: 1 }, { unique: true });
WhatsAppTemplateSchema.index({ businessId: 1, status: 1 });

WhatsAppTemplateSchema.methods.toMetaPayload = function () {
  return {
    name: this.name,
    language: this.language,
    category: this.category,
    components: this.components.map((c) => {
      const out = { type: c.type };
      if (c.type === 'HEADER') {
        out.format = c.format || 'TEXT';
        if (out.format === 'TEXT' && c.text) out.text = c.text;
        if (c.example?.header_text?.length) out.example = { header_text: c.example.header_text };
        if (c.example?.header_handle?.length) out.example = { header_handle: c.example.header_handle };
      }
      if (c.type === 'BODY') {
        out.text = c.text || '';
        if (c.example?.body_text?.length) out.example = { body_text: c.example.body_text };
      }
      if (c.type === 'FOOTER' && c.text) out.text = c.text;
      if (c.type === 'BUTTONS' && c.buttons?.length) {
        out.buttons = c.buttons.map((b) => {
          const btn = { type: b.type, text: b.text };
          if (b.type === 'URL') {
            btn.url = b.url;
            if (b.example?.length) btn.example = b.example;
          }
          if (b.type === 'PHONE_NUMBER') btn.phone_number = b.phone_number;
          return btn;
        });
      }
      return out;
    }),
  };
};

export default mongoose.models.WhatsAppTemplate
  || mongoose.model('WhatsAppTemplate', WhatsAppTemplateSchema);
