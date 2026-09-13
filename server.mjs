import { createServer } from 'node:http';
import { mkdirSync, readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const distRoot = resolve(root, 'dist');
const dataRoot = resolve(root, 'data');
const dbPath = join(dataRoot, 'tumblez-finance.db');
mkdirSync(dataRoot, { recursive: true });
const db = new DatabaseSync(dbPath);
const sessions = new Map();

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    pin_salt TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    account TEXT NOT NULL DEFAULT '',
    value REAL NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank TEXT NOT NULL,
    name TEXT NOT NULL,
    last_four TEXT NOT NULL DEFAULT '',
    expiry TEXT NOT NULL DEFAULT '',
    statement_day INTEGER,
    due_day INTEGER,
    credit_limit REAL NOT NULL DEFAULT 0,
    tone TEXT NOT NULL DEFAULT 'ink',
    logo TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS installments (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    statement_name TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'อื่น ๆ',
    card_id TEXT NOT NULL DEFAULT '',
    total_price REAL NOT NULL DEFAULT 0,
    interest REAL NOT NULL DEFAULT 0,
    total_installments INTEGER NOT NULL DEFAULT 1,
    paid_installments INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_assets_user_category ON assets(user_id, category);
  CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);
  CREATE INDEX IF NOT EXISTS idx_installments_user_status ON installments(user_id, paid_installments, total_installments);
`);

const demoEmail = 'demo@tumblez.finance';
const demoPin = '1234';
function hashPin(pin, salt) { return pbkdf2Sync(pin, salt, 120000, 32, 'sha256').toString('hex'); }
function createUser(email, pin) { const salt = randomBytes(16).toString('hex'); const result = db.prepare('INSERT INTO users (email, pin_salt, pin_hash) VALUES (?, ?, ?)').run(email, salt, hashPin(pin, salt)); return Number(result.lastInsertRowid); }
let demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
const demoUserId = demoUser ? Number(demoUser.id) : createUser(demoEmail, demoPin);
if (demoUser && String(db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(demoUserId).pin_hash).length !== 64) { const salt = 'tumblez-demo-salt-v1'; db.prepare('UPDATE users SET pin_salt = ?, pin_hash = ? WHERE id = ?').run(salt, hashPin(demoPin, salt), demoUserId); }

const conceptAssets = [
  ['cash-concept-1','cash','asset','เงินสำรองฉุกเฉิน','บัญชีสภาพคล่องหลัก',180000,'เป้าหมาย 6 เดือนของค่าใช้จ่าย'], ['cash-concept-2','cash','asset','บัญชีใช้จ่ายประจำวัน','บัญชีธนาคารหลัก',42000,'ยอดสำหรับหมุนเวียน'], ['investment-concept-1','investment','asset','กองทุนระยะยาว','พอร์ตลงทุน A',420000,'ติดตามผลตอบแทนรายเดือน'], ['investment-concept-2','investment','asset','พอร์ตกระจายความเสี่ยง','พอร์ตลงทุน B',160000,'สัดส่วนหุ้นและตราสารหนี้'], ['personal-concept-1','personal','asset','ที่อยู่อาศัย','เอกสารทรัพย์สิน',2800000,'มูลค่าประเมินล่าสุด'], ['personal-concept-2','personal','asset','ยานพาหนะ','เอกสารทรัพย์สิน',520000,'มูลค่าประเมินปัจจุบัน'], ['debt-concept-1','debt','liability','สินเชื่อที่อยู่อาศัย','สัญญาสินเชื่อ A',1650000,'ทบทวนยอดคงเหลือทุกเดือน'], ['debt-concept-2','debt','liability','สินเชื่อยานพาหนะ','สัญญาสินเชื่อ B',210000,'เหลือระยะเวลาผ่อนตามสัญญา']
];
const conceptCards = [
  ['card-concept-primary','Primary Bank','Everyday Card','1284','2028-12',15,5,100000,'ink','/assets/banks/primary-bank.svg'], ['card-concept-travel','Travel Bank','Travel Rewards','5702','2029-06',22,7,150000,'violet','/assets/banks/travel-bank.svg'], ['card-concept-digital','Digital Bank','Digital Flex','9341','2027-10',28,13,70000,'teal','/assets/banks/digital-bank.svg']
];
const conceptItems = [
  ['item-concept-work','อุปกรณ์ทำงาน','WORK EQUIPMENT','Gadget','card-concept-primary',36000,0,10,3], ['item-concept-home','เครื่องใช้ในบ้าน','HOME LIVING','เครื่องใช้ไฟฟ้า','card-concept-digital',8400,0,6,2], ['item-concept-trip','ทริปพักผ่อนประจำปี','ANNUAL TRIP','ท่องเที่ยว','card-concept-travel',24000,600,12,4], ['item-concept-health','แพ็กเกจสุขภาพ','HEALTH PLAN','สุขภาพ','card-concept-primary',12000,0,6,6]
];
if (!db.prepare('SELECT 1 FROM assets WHERE user_id = ? LIMIT 1').get(demoUserId)) {
  db.exec('BEGIN');
  try {
    const assetStmt = db.prepare('INSERT INTO assets (id,user_id,category,kind,name,account,value,notes) VALUES (?,?,?,?,?,?,?,?)');
    conceptAssets.forEach(row => assetStmt.run(row[0], demoUserId, ...row.slice(1)));
    const cardStmt = db.prepare('INSERT INTO cards (id,user_id,bank,name,last_four,expiry,statement_day,due_day,credit_limit,tone,logo) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    conceptCards.forEach(row => cardStmt.run(row[0], demoUserId, ...row.slice(1)));
    const itemStmt = db.prepare('INSERT INTO installments (id,user_id,name,statement_name,category,card_id,total_price,interest,total_installments,paid_installments) VALUES (?,?,?,?,?,?,?,?,?,?)');
    conceptItems.forEach(row => itemStmt.run(row[0], demoUserId, ...row.slice(1)));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

function sendJson(res, status, payload) { const body = JSON.stringify(payload); res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' }); res.end(body); }
function parseBody(req) { return new Promise((resolveBody, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 1_000_000) reject(new Error('payload too large')); }); req.on('end', () => { try { resolveBody(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('invalid json')); } }); req.on('error', reject); }); }
function userFrom(req) { const header = req.headers.authorization || ''; const token = header.startsWith('Bearer ') ? header.slice(7) : ''; const session = sessions.get(token); if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return null; } return session.userId; }
function requireUser(req, res) { const userId = userFrom(req); if (!userId) { sendJson(res, 401, { error:'กรุณาเข้าสู่ระบบ' }); return null; } return userId; }
function rowsFor(userId) { return { assets:db.prepare('SELECT id,category,kind,name,account,value,notes FROM assets WHERE user_id = ? ORDER BY rowid').all(userId), cards:db.prepare('SELECT id,bank,name,last_four AS lastFour,expiry,statement_day AS statementDay,due_day AS dueDay,credit_limit AS "limit",tone,logo FROM cards WHERE user_id = ? ORDER BY rowid').all(userId), items:db.prepare('SELECT id,name,statement_name AS statementName,category,card_id AS cardId,total_price AS totalPrice,interest,total_installments AS totalInstallments,paid_installments AS paidInstallments FROM installments WHERE user_id = ? ORDER BY rowid').all(userId) }; }
function isSafePath(file) { return file === distRoot || file.startsWith(distRoot + '\\') || file.startsWith(distRoot + '/'); }
function serveStatic(req, res, pathname) { const requested = pathname === '/' ? '/index.html' : pathname; const file = resolve(distRoot, normalize(requested).replace(/^[/\\]+/, '')); if (!isSafePath(file) || !existsSync(file)) { res.writeHead(404); return res.end('Not found'); } const contentTypes = { '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8' }; res.writeHead(200, { 'content-type':contentTypes[extname(file).toLowerCase()] || 'application/octet-stream' }); res.end(readFileSync(file)); }

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { status:'ok', database:'sqlite' });
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    try { const body = await parseBody(req); const email = String(body.email || '').trim().toLowerCase(); const pin = String(body.pin || ''); const user = db.prepare('SELECT id,email,pin_salt,pin_hash FROM users WHERE email = ?').get(email); if (!user || !timingSafeEqual(Buffer.from(hashPin(pin, user.pin_salt), 'hex'), Buffer.from(user.pin_hash, 'hex'))) return sendJson(res, 401, { error:'อีเมลหรือ PIN ไม่ถูกต้อง' }); const token = randomBytes(32).toString('hex'); sessions.set(token, { userId:Number(user.id), expires:Date.now() + 1000 * 60 * 60 * 12 }); return sendJson(res, 200, { token, user:{ id:Number(user.id), email:user.email } }); } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') { const header = req.headers.authorization || ''; if (header.startsWith('Bearer ')) sessions.delete(header.slice(7)); return sendJson(res, 200, { status:'signed_out' }); }
  if (req.method === 'GET' && url.pathname === '/api/me') { const userId = requireUser(req, res); if (!userId) return; const user = db.prepare('SELECT id,email FROM users WHERE id = ?').get(userId); return sendJson(res, 200, { user:{ id:Number(user.id), email:user.email } }); }
  if (req.method === 'GET' && url.pathname === '/api/finance') { const userId = requireUser(req, res); if (!userId) return; return sendJson(res, 200, rowsFor(userId)); }
  if (req.method === 'PUT' && url.pathname === '/api/finance') {
    const userId = requireUser(req, res); if (!userId) return;
    try { const body = await parseBody(req); const assets = Array.isArray(body.assets) ? body.assets : []; const cards = Array.isArray(body.cards) ? body.cards : []; const items = Array.isArray(body.items) ? body.items : []; db.exec('BEGIN'); db.prepare('DELETE FROM installments WHERE user_id = ?').run(userId); db.prepare('DELETE FROM assets WHERE user_id = ?').run(userId); db.prepare('DELETE FROM cards WHERE user_id = ?').run(userId); const assetStmt = db.prepare('INSERT INTO assets (id,user_id,category,kind,name,account,value,notes) VALUES (?,?,?,?,?,?,?,?)'); assets.forEach(r => assetStmt.run(String(r.id),userId,String(r.category || 'cash'),String(r.kind || 'asset'),String(r.name || ''),String(r.account || ''),Number(r.value) || 0,String(r.notes || ''))); const cardStmt = db.prepare('INSERT INTO cards (id,user_id,bank,name,last_four,expiry,statement_day,due_day,credit_limit,tone,logo) VALUES (?,?,?,?,?,?,?,?,?,?,?)'); cards.forEach(c => cardStmt.run(String(c.id),userId,String(c.bank || ''),String(c.name || ''),String(c.lastFour || ''),String(c.expiry || ''),Number(c.statementDay) || null,Number(c.dueDay) || null,Number(c.limit) || 0,String(c.tone || 'ink'),String(c.logo || ''))); const itemStmt = db.prepare('INSERT INTO installments (id,user_id,name,statement_name,category,card_id,total_price,interest,total_installments,paid_installments) VALUES (?,?,?,?,?,?,?,?,?,?)'); items.forEach(i => itemStmt.run(String(i.id),userId,String(i.name || ''),String(i.statementName || ''),String(i.category || 'อื่น ๆ'),String(i.cardId || ''),Number(i.totalPrice) || 0,Number(i.interest) || 0,Math.max(1,Number(i.totalInstallments) || 1),Math.max(0,Number(i.paidInstallments) || 0))); db.exec('COMMIT'); return sendJson(res, 200, { status:'saved', ...rowsFor(userId) }); } catch (error) { try { db.exec('ROLLBACK'); } catch {} return sendJson(res, 400, { error:error.message }); }
  }
  if (req.method === 'GET') return serveStatic(req, res, url.pathname);
  return sendJson(res, 405, { error:'method not allowed' });
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => console.log(`TumbleZ Finance API listening on http://127.0.0.1:${port}`));

