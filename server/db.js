import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'database.sqlite')

let db

export function getDb() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      user_id       TEXT PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Trip (
      trip_id       TEXT PRIMARY KEY,
      user_id       TEXT    REFERENCES User(user_id) ON DELETE CASCADE DEFAULT NULL,
      destination   TEXT    NOT NULL,
      duration      TEXT    NOT NULL,
      travel_month  INTEGER NOT NULL,
      transport     TEXT    NOT NULL,
      current_temp  REAL    DEFAULT NULL,
      weather_status TEXT   DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS FamilyMember (
      member_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id     TEXT    NOT NULL REFERENCES Trip(trip_id) ON DELETE CASCADE,
      relation    TEXT    NOT NULL,
      age         INTEGER NOT NULL,
      wheelchair  INTEGER NOT NULL DEFAULT 0,
      illness     INTEGER NOT NULL DEFAULT 0,
      medication  TEXT    DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS AI_Result (
      result_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id       TEXT    NOT NULL REFERENCES Trip(trip_id) ON DELETE CASCADE,
      safety_notice TEXT    NOT NULL DEFAULT '',
      emergency_tip TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ChecklistItem (
      item_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id     TEXT    NOT NULL REFERENCES Trip(trip_id) ON DELETE CASCADE,
      member_id   INTEGER REFERENCES FamilyMember(member_id) ON DELETE SET NULL,
      item_name   TEXT    NOT NULL,
      category    TEXT    NOT NULL DEFAULT '개인',
      is_checked  INTEGER NOT NULL DEFAULT 0,
      is_custom   INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_family_trip ON FamilyMember(trip_id);
    CREATE INDEX IF NOT EXISTS idx_ai_trip ON AI_Result(trip_id);
    CREATE INDEX IF NOT EXISTS idx_checklist_trip ON ChecklistItem(trip_id);
  `)

  // 마이그레이션: 신규 컬럼 추가
  try { db.exec(`ALTER TABLE Trip ADD COLUMN user_id TEXT DEFAULT NULL`) } catch {}
  try { db.exec(`ALTER TABLE Trip ADD COLUMN current_temp REAL DEFAULT NULL`) } catch {}
  try { db.exec(`ALTER TABLE Trip ADD COLUMN weather_status TEXT DEFAULT ''`) } catch {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_trip_user ON Trip(user_id)`) } catch {}
}
