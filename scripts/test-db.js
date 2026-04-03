import { db } from '../src/db/index.ts';
import { lessons } from '../src/db/schema.ts';
async function test() {
  const l = await db.select().from(lessons);
  console.log(l);
}
test().catch(console.error);
