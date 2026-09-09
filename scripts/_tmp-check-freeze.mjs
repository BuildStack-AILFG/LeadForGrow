import mongoose from 'mongoose';
import fs from 'fs';
for (const rawLine of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const line = rawLine.replace(/\r$/, '');
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const BusinessSchema = new mongoose.Schema({}, { strict: false });
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema, 'businesses');
await mongoose.connect(process.env.MONGODB_URI);
const biz = await Business.findOne({ businessName: /^LeadForGrow$/i }).lean();
console.log({ id: biz._id.toString(), frozen: biz.frozen, frozenAt: biz.frozenAt, frozenReason: biz.frozenReason });
await mongoose.disconnect();
