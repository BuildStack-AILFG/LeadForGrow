// One-off data fix: timestamps stored as epoch SECONDS but read as milliseconds show up as January 1970. The real time is
// the same number x 1000 (11 WhatsApp conversations, 11 legacy rows and 3 messages were found like that).
//
//   node --env-file=.env scripts/fix-epoch-timestamps.mjs            dry run: prints counts and before/after dates, writes nothing
//   node --env-file=.env scripts/fix-epoch-timestamps.mjs --apply    writes the fix
//
// Touches ONLY documents whose date is between 1e9 and 5e9 ms (12 Jan - 2 Mar 1970, never a real message time):
// Conversation.lastMessageAt / lastInboundAt, WhatsAppConversation.lastMessageAt, Message.timestamp. Nothing else.
// Idempotent: after one run nothing is left in 1970, so a second run changes nothing. No phone numbers or text are printed.
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('../', import.meta.url);
register(new URL('scripts/test-alias-hooks.mjs', ROOT));
const load = (p) => import(new URL(p, ROOT).href);
const { dbConnect } = await load('lib/mongodb.js');
const { normalizeTimestamp } = await load('lib/omnichannel/timestamps.js');
const { default: mongoose } = await load('node_modules/mongoose/index.js');

const apply = process.argv.includes('--apply');
const inBadRange = (d) => d instanceof Date && d.getTime() >= 1e9 && d.getTime() < 5e9;
const range = (f) => ({ [f]: { $gte: new Date(1e9), $lt: new Date(5e9) } });
const targets = [
  { coll: 'conversations', fields: ['lastMessageAt', 'lastInboundAt'] },
  { coll: 'whatsappconversations', fields: ['lastMessageAt'] },
  { coll: 'messages', fields: ['timestamp'] },
];

await dbConnect();
try {
  const db = mongoose.connection;
  console.log(apply ? 'APPLY MODE' : 'DRY RUN (nothing is written)');
  for (const { coll, fields } of targets) {
    const c = db.collection(coll);
    const docs = await c.find({ $or: fields.map(range) }).project(Object.fromEntries(fields.map((f) => [f, 1]))).toArray();
    let changed = 0;
    for (const d of docs) {
      const $set = {};
      for (const f of fields) if (inBadRange(d[f])) $set[f] = normalizeTimestamp(d[f]);
      if (!Object.keys($set).length) continue;
      changed += 1;
      if (changed <= 2) {
        const f0 = Object.keys($set)[0];
        console.log(`  ${coll}.${f0}: ${new Date(d[f0]).toISOString().slice(0, 19)} -> ${$set[f0].toISOString().slice(0, 19)}`);
      }
      if (apply) await c.updateOne({ _id: d._id }, { $set });
    }
    console.log(`${coll}: ${changed} document(s) ${apply ? 'fixed' : 'would be fixed'}`);
  }
  if (apply) {
    for (const { coll, fields } of targets) {
      const left = await db.collection(coll).countDocuments({ $or: fields.map(range) });
      console.log(`${coll}: still in 1970 after the fix: ${left}`);
    }
  }
} finally {
  await mongoose.disconnect();
}
