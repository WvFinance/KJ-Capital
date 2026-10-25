// Locks the site's data files with the site password so they can't be read on GitHub.
//
//   KJ_PASSWORD=... node scripts/lock.mjs lock     data/*.json  -> data/*.enc.json
//   KJ_PASSWORD=... node scripts/lock.mjs unlock   data/*.enc.json -> data/*.json
//   KJ_PASSWORD=... node scripts/lock.mjs setup    new salt + check value in data/lock.json (run when the password changes, then lock)
//
// The plain .json files are gitignored; only the .enc.json files are committed.
// The page (index.html and assets/app.js) unlocks them in the browser with the same settings:
// PBKDF2-SHA256 on the lowercased password, then AES-256-GCM.
import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DATA = new URL("../data/", import.meta.url);
const FILES = ["portfolio", "prices", "news"];
const LOCK = new URL("lock.json", DATA);
const ITER = 600000;
const CHECK = "kj-ok";

const pass = (process.env.KJ_PASSWORD || "").trim().toLowerCase();
if (!pass) {
  console.error("KJ_PASSWORD is not set. Add it under the repo's Settings > Secrets and variables > Actions.");
  process.exit(1);
}

function seal(key, text) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([c.update(text, "utf8"), c.final(), c.getAuthTag()]);
  return { iv: iv.toString("base64"), data: data.toString("base64") };
}

function open(key, box) {
  const buf = Buffer.from(box.data, "base64");
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(box.iv, "base64"));
  d.setAuthTag(buf.subarray(buf.length - 16));
  return Buffer.concat([d.update(buf.subarray(0, buf.length - 16)), d.final()]).toString("utf8");
}

const mode = process.argv[2];

if (mode === "setup") {
  const salt = randomBytes(16);
  const key = pbkdf2Sync(pass, salt, ITER, 32, "sha256");
  writeFileSync(LOCK, JSON.stringify({ v: 1, iter: ITER, salt: salt.toString("base64"), check: seal(key, CHECK) }, null, 1) + "\n");
  console.log("Wrote data/lock.json. Now run: node scripts/lock.mjs lock");
  process.exit(0);
}

const lock = JSON.parse(readFileSync(LOCK, "utf8"));
const key = pbkdf2Sync(pass, Buffer.from(lock.salt, "base64"), lock.iter, 32, "sha256");
try { if (open(key, lock.check) !== CHECK) throw 0; }
catch { console.error("KJ_PASSWORD doesn't match data/lock.json."); process.exit(1); }

for (const name of FILES) {
  const plain = new URL(`${name}.json`, DATA), locked = new URL(`${name}.enc.json`, DATA);
  if (mode === "lock") {
    if (!existsSync(plain)) continue;
    const text = readFileSync(plain, "utf8");
    // Skip unchanged files so the bots don't commit a new scramble of the same data.
    if (existsSync(locked)) { try { if (open(key, JSON.parse(readFileSync(locked, "utf8"))) === text) continue; } catch {} }
    writeFileSync(locked, JSON.stringify(seal(key, text)) + "\n");
    console.log(`Locked ${name}`);
  } else if (mode === "unlock") {
    if (!existsSync(locked)) continue;
    writeFileSync(plain, open(key, JSON.parse(readFileSync(locked, "utf8"))));
    console.log(`Unlocked ${name}`);
  } else {
    console.error("Use: lock, unlock or setup");
    process.exit(1);
  }
}
