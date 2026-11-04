"""No-cache local preview with private, persistent RSVP submissions.

Only binds to loopback by default. No public admin HTTP endpoint or third-party
network calls. SQLite file is excluded from git and never served as static content.
"""
from __future__ import annotations
import json
import os
import re
import sqlite3
import threading
import time
from collections import defaultdict, deque
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
RATE = defaultdict(deque)
RATE_LOCK = threading.Lock()
STATIC_TYPES = {".html", ".js", ".css", ".png", ".webp", ".jpg", ".jpeg",
                ".svg", ".ico", ".gif", ".woff", ".woff2", ".ttf", ".txt", ".webmanifest", ".mp4"}
UUID_RE = re.compile(r"^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$", re.I)
SCHEMA = """CREATE TABLE IF NOT EXISTS rsvps (
    receipt TEXT PRIMARY KEY,
    guest_name TEXT NOT NULL,
    attendance TEXT NOT NULL CHECK(attendance IN ('yes','no')),
    guests INTEGER NOT NULL CHECK(guests BETWEEN 0 AND 5),
    wish TEXT NOT NULL DEFAULT '',
    consent INTEGER NOT NULL DEFAULT 0 CHECK(consent IN (0,1)),
    approval TEXT NOT NULL DEFAULT 'pending' CHECK(approval IN ('pending','approved','rejected')),
    created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)"""

def database():
    dbfile = Path(os.environ.get("RSVP_DB_PATH", str(ROOT/".private"/"rsvps.sqlite3")))
    dbfile.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(dbfile), timeout=10)
    db.row_factory = sqlite3.Row
    db.execute(SCHEMA)
    return db

def validate(payload):
    if not isinstance(payload, dict):
        raise ValueError("Invalid RSVP.")
    request_id=payload.get("requestId")
    name=payload.get("name")
    attending=payload.get("attendance")
    guests=payload.get("guests")
    wish=payload.get("wish", "")
    consent=payload.get("shareWish", False)
    if not isinstance(request_id,str) or not UUID_RE.fullmatch(request_id):
        raise ValueError("Invalid submission identifier.")
    if not isinstance(name,str):
        raise ValueError("Enter your name.")
    name=" ".join(name.split())
    if not 1 <= len(name) <= 60 or any(ord(ch)<32 for ch in name):
        raise ValueError("Name must be 1 to 60 characters.")
    if attending not in ("yes","no"):
        raise ValueError("Please choose attendance.")
    if type(guests) is not int or not ((attending=="yes" and 1<=guests<=5) or (attending=="no" and guests==0)):
        raise ValueError("Invalid guest count.")
    if not isinstance(wish,str):
        raise ValueError("Wish must be text.")
    wish=wish.strip()
    if len(wish)>300 or any(ord(ch)<32 and ch not in "\n\t" for ch in wish):
        raise ValueError("Wish must be 300 characters or fewer.")
    if type(consent) is not bool:
        raise ValueError("Invalid wish sharing preference.")
    return (request_id.lower(),name,attending,guests,wish,int(consent and bool(wish)))

def store(payload):
    row=validate(payload)
    with database() as db:
        original=db.execute("SELECT receipt,guest_name,attendance,guests,wish,consent FROM rsvps WHERE receipt=?",(row[0],)).fetchone()
        if original:
            if tuple(original)!=row:
                raise ValueError("Submission identifier already used.")
            return {"ok":True,"saved":True,"duplicate":True,"receipt":row[0]}
        db.execute("INSERT INTO rsvps(receipt,guest_name,attendance,guests,wish,consent) VALUES(?,?,?,?,?,?)",row)
        return {"ok":True,"saved":True,"duplicate":False,"receipt":row[0]}

def published():
    with database() as db:
        rows=db.execute("""SELECT guest_name,wish,created_at FROM rsvps WHERE approval='approved'
             AND consent=1 AND length(wish)>0 ORDER BY created_at DESC LIMIT 20""").fetchall()
    return [{"name":r["guest_name"],"wish":r["wish"],"createdAt":r["created_at"]} for r in rows]

def safe_static(path):
    value=unquote(urlsplit(path).path)
    if "\x00" in value:
        return False
    parts=Path(value).parts
    if any(p in (".","..") or p.startswith(".") for p in parts if p not in ("/","")):
        return False
    if any(p in {"tools","tests","api","database","node_modules","test-results","playwright-report"} for p in parts):
        return False
    return value=="/" or (not value.endswith("/") and Path(value).suffix.lower() in STATIC_TYPES)

class DevelopmentHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)

    def end_headers(self):
        self.send_header("Cache-Control","no-store,max-age=0")
        self.send_header("X-Content-Type-Options","nosniff")
        super().end_headers()

    def send_head(self):
        for name in ("If-Modified-Since","If-None-Match"):
            if name in self.headers:
                del self.headers[name]
        return super().send_head()

    def response_json(self,status,value):
        raw=json.dumps(value,ensure_ascii=False).encode("utf8")
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_HEAD(self):
        if not safe_static(self.path):return self.send_error(404)
        return super().do_HEAD()

    def do_GET(self):
        path=urlsplit(self.path).path
        if path=="/api/wishes":
            return self.response_json(200,{"wishes":published()})
        if path=="/api/rsvp/status":
            return self.response_json(200,{"accepting":True,"storage":"local-private"})
        if not safe_static(self.path):return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path!="/api/rsvp":
            return self.response_json(404,{"ok":False,"error":"Not found."})
        origin=self.headers.get("Origin")
        if origin and urlsplit(origin).netloc!=self.headers.get("Host"):
            return self.response_json(403,{"ok":False,"error":"Wrong origin."})
        if self.headers.get("Content-Type","").split(";",1)[0].strip().lower()!="application/json":
            return self.response_json(415,{"ok":False,"error":"JSON required."})
        try:size=int(self.headers.get("Content-Length","-1"))
        except ValueError:size=-1
        if not 1<=size<=2048:
            return self.response_json(413,{"ok":False,"error":"Invalid request size."})
        try:payload=json.loads(self.rfile.read(size))
        except (ValueError,UnicodeDecodeError):
            return self.response_json(400,{"ok":False,"error":"Invalid JSON."})
        with RATE_LOCK:
            key=self.client_address[0]
            now=time.monotonic()
            items=RATE[key]
            while items and now-items[0]>600:items.popleft()
            if len(items)>=12:
                return self.response_json(429,{"ok":False,"error":"Too many attempts. Try later."})
            items.append(now)
        try:
            result=store(payload)
        except ValueError as error:
            return self.response_json(400,{"ok":False,"error":str(error)})
        except Exception:
            return self.response_json(503,{"ok":False,"error":"Unable to save RSVP. Please retry."})
        return self.response_json(200 if result["duplicate"] else 201,result)

if __name__=="__main__":
    with database():pass
    # Never expose guests' personal information on local Wi-Fi by default.
    host=os.environ.get("RSVP_BIND","127.0.0.1")
    server=ThreadingHTTPServer((host,8000),DevelopmentHandler)
    print("RSVP-enabled preview: http://localhost:8000/ (data stored privately)",flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:print("\nStopped.")
    finally:server.server_close()
