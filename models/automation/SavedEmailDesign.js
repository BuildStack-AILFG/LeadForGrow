import mongoose from 'mongoose';

/**
 * A business's own reusable email template ("My templates").
 *
 * format 'design': one of the built-in designs (baseTemplateId) with the
 *   business's own values — rendered on demand, so improvements to the
 *   built-in layout reach saved templates too.
 * format 'html': the business's own HTML (pasted/uploaded), stored sanitised.
 */
const SavedEmailDesignSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    format: { type: String, enum: ['design', 'html'], required: true },
    baseTemplateId: String,
    values: mongoose.Schema.Types.Mixed,
    html: String,
    subject: { type: String, trim: true, maxlength: 200 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

SavedEmailDesignSchema.index({ businessId: 1, updatedAt: -1 });

export default mongoose.models.SavedEmailDesign || mongoose.model('SavedEmailDesign', SavedEmailDesignSchema);
