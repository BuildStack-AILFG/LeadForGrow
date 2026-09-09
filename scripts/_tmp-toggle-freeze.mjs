// TEMPORARY one-off verification script — toggles Business.frozen on "Pistonsgarage".
// Delete after use. Usage: node scripts/_tmp-toggle-freeze.mjs on|off
import mongoose from 'mongoose';
import fs from 'fs';

for (const rawLine of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const line = rawLine.replace(/\r$/, '');
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const mode = process.argv[2];
if (!['on', 'off'].includes(mode)) {
  console.error('Usage: node scripts/_tmp-toggle-freeze.mjs on|off');
  process.exit(1);
}

const BusinessSchema = new mongoose.Schema({}, { strict: false });
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema, 'businesses');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const target = process.argv[3] || 'pistonsgarage';
  const biz = await Business.findOne({ businessName: new RegExp(target, 'i') });
  if (!biz) {
    console.error('Business not found');
    process.exit(1);
  }
  const frozen = mode === 'on';
  await Business.updateOne(
    { _id: biz._id },
    { $set: { frozen, frozenReason: frozen ? 'Payment overdue — test freeze' : '', frozenAt: frozen ? new Date() : null } }
  );
  console.log(`Set frozen=${frozen} on business ${biz.businessName} (${biz._id})`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
