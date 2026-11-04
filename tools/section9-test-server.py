"""Isolated Section 9 Playwright server on loopback port 8019.

It reuses the project's approved static/RSVP handler without editing the
server used for localhost:8000 and cannot serve another Git worktree.
Personal RSVP data remains local to this worktree.
"""
from http.server import ThreadingHTTPServer
from pathlib import Path
import os
import runpy

MODULE = runpy.run_path(str(Path(__file__).resolve().with_name("dev-server.py")))
PORT = 8019

if __name__ == "__main__":
    # Do not expose a test endpoint on the LAN.
    with MODULE["database"]():
        pass
    server = ThreadingHTTPServer(("127.0.0.1", PORT), MODULE["DevelopmentHandler"])
    print(f"Section 9 isolated QA: http://127.0.0.1:{PORT}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
