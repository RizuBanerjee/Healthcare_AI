import sqlite3

conn = sqlite3.connect("healthcare.db")

cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symptom_disease TEXT,
    symptom_confidence REAL,
    skin_disease TEXT,
    skin_confidence REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

conn.commit()
conn.close()

print("Database Created")