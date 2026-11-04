"""Standard-library HTTP tests: actual save, duplicate, moderation and privacy."""
import http.client
import json
import os
import sqlite3
import sys
import tempfile
import threading
import unittest
import uuid
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
import importlib.util
spec=importlib.util.spec_from_file_location("rsvp_dev_server",ROOT/"tools"/"dev-server.py")
server_module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)
DevelopmentHandler=server_module.DevelopmentHandler
database=server_module.database

class RSVPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory=tempfile.TemporaryDirectory()
        cls.previous=os.environ.get("RSVP_DB_PATH")
        os.environ["RSVP_DB_PATH"]=str(Path(cls.directory.name)/"rsvp.sqlite3")
        cls.server=ThreadingHTTPServer(("127.0.0.1",0),DevelopmentHandler)
        cls.port=cls.server.server_address[1]
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join(timeout=5)
        if cls.previous is None:os.environ.pop("RSVP_DB_PATH",None)
        else:os.environ["RSVP_DB_PATH"]=cls.previous
        cls.directory.cleanup()

    def request(self,method,path,payload=None,origin=None,content_type="application/json"):
        conn=http.client.HTTPConnection("127.0.0.1",self.port,timeout=5)
        headers={}
        if payload is not None:
            headers["Content-Type"]=content_type
            headers["Origin"]=origin or f"http://127.0.0.1:{self.port}"
        data=json.dumps(payload).encode("utf8") if payload is not None else None
        conn.request(method,path,body=data,headers=headers)
        response=conn.getresponse();status=response.status;raw=response.read();conn.close()
        try:return status,json.loads(raw)
        except ValueError:return status,raw

    def make(self,**kwargs):
        data={"requestId":str(uuid.uuid4()),"name":"Example Guest","attendance":"yes","guests":2,
              "wish":"Congratulations!","shareWish":True}
        data.update(kwargs);return data

    def test_persistence_duplicate_and_private_moderation(self):
        row=self.make(name="Consent Guest")
        code,result=self.request("POST","/api/rsvp",row)
        self.assertEqual(code,201);self.assertTrue(result["saved"])
        code,result=self.request("POST","/api/rsvp",row)
        self.assertEqual(code,200);self.assertTrue(result["duplicate"])
        with database() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM rsvps WHERE receipt=?",(row["requestId"],)).fetchone()[0],1)
        self.assertFalse(any(w["name"]=="Consent Guest" for w in self.request("GET","/api/wishes")[1]["wishes"]))
        with database() as db:
            db.execute("UPDATE rsvps SET approval='approved' WHERE receipt=?",(row["requestId"],))
        self.assertTrue(any(w["name"]=="Consent Guest" for w in self.request("GET","/api/wishes")[1]["wishes"]))

    def test_no_consent_never_shown(self):
        row=self.make(name="Private Guest",shareWish=False)
        self.assertEqual(self.request("POST","/api/rsvp",row)[0],201)
        with database() as db:db.execute("UPDATE rsvps SET approval='approved' WHERE receipt=?",(row["requestId"],))
        self.assertFalse(any(w["name"]=="Private Guest" for w in self.request("GET","/api/wishes")[1]["wishes"]))

    def test_validation_and_csrf(self):
        self.assertEqual(self.request("POST","/api/rsvp",self.make(name=" "))[0],400)
        self.assertEqual(self.request("POST","/api/rsvp",self.make(attendance="no",guests=3))[0],400)
        self.assertEqual(self.request("POST","/api/rsvp",self.make(),origin="https://elsewhere.test")[0],403)
        self.assertEqual(self.request("POST","/api/rsvp",self.make(),content_type="text/plain")[0],415)

    def test_local_private_file_not_served(self):
        self.assertEqual(self.request("GET","/.private/rsvp.sqlite3")[0],404)
        self.assertEqual(self.request("GET","/tools/dev-server.py")[0],404)
        self.assertEqual(self.request("GET","/api/rsvp/status")[0],200)

if __name__=="__main__":unittest.main()
