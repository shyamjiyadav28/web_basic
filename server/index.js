import express from 'express';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'restaurant.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    reservation_date TEXT NOT NULL,
    reservation_time TEXT NOT NULL,
    guests TEXT NOT NULL,
    request TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_phone TEXT,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const app = express();
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.post('/api/reservations', (req, res) => {
  const { fullName, phone, email, date, time, guests, request = '' } = req.body;
  if (![fullName, phone, email, date, time, guests].every(Boolean)) return res.status(400).json({ message: 'Please complete every required reservation field.' });
  const result = db.prepare('INSERT INTO reservations (full_name, phone, email, reservation_date, reservation_time, guests, request) VALUES (?, ?, ?, ?, ?, ?, ?)').run(fullName, phone, email, date, time, guests, request);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Your table reservation request has been received!' });
});
app.post('/api/orders', (req, res) => {
  const { items, total, customerName = '', customerPhone = '' } = req.body;
  if (!Array.isArray(items) || items.length === 0 || !Number.isFinite(total) || total <= 0) return res.status(400).json({ message: 'Your cart is empty or invalid.' });
  const result = db.prepare('INSERT INTO orders (customer_name, customer_phone, items, total) VALUES (?, ?, ?, ?)').run(customerName, customerPhone, JSON.stringify(items), total);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Order received! We will contact you shortly to confirm it.' });
});
app.get('/api/reservations', (_, res) => res.json(db.prepare('SELECT * FROM reservations ORDER BY id DESC').all()));
app.get('/api/orders', (_, res) => res.json(db.prepare('SELECT * FROM orders ORDER BY id DESC').all()));

app.listen(3001, () => console.log('Restaurant API running at http://localhost:3001'));

