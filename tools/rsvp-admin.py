"""Private local RSVP management. Never host this file or expose its output publicly."""
import argparse
import csv
from pathlib import Path
from dev_server import database, ROOT

def spreadsheet_safe(text):
    value=str(text)
    return "'"+value if value.lstrip().startswith(("=","+","-","@")) else value

p=argparse.ArgumentParser(description="Inspect, approve, reject or export local RSVPs")
p.add_argument("action",choices=["list","approve","reject","delete","export"])
p.add_argument("value",nargs="?")
args=p.parse_args()
with database() as db:
    if args.action=="list":
        for row in db.execute("SELECT receipt,guest_name,attendance,guests,consent,approval,created_at FROM rsvps ORDER BY created_at DESC LIMIT 100"):
            print(row["receipt"],"|",row["guest_name"],"|",row["attendance"],"| guests:",row["guests"],"| publish consent:",bool(row["consent"]),"|",row["approval"],"|",row["created_at"])
    elif args.action in ("approve","reject","delete"):
        if not args.value:p.error("You must supply the receipt UUID.")
        if args.action=="approve":
            q="UPDATE rsvps SET approval='approved' WHERE receipt=? AND consent=1 AND length(wish)>0"
        elif args.action=="reject":q="UPDATE rsvps SET approval='rejected' WHERE receipt=?"
        else:q="DELETE FROM rsvps WHERE receipt=?"
        count=db.execute(q,(args.value,)).rowcount
        print("Records updated:",count,"(approval requires explicit guest consent)")
    else:
        file=Path(args.value or str(ROOT/".private"/"rsvp-export.csv"))
        file.parent.mkdir(parents=True,exist_ok=True)
        with file.open("w",newline="",encoding="utf8") as out:
            writer=csv.writer(out);writer.writerow(["receipt","name","attendance","guests","wish","consent","approval","created_at"])
            for row in db.execute("SELECT receipt,guest_name,attendance,guests,wish,consent,approval,created_at FROM rsvps ORDER BY created_at"):
                writer.writerow([spreadsheet_safe(value) for value in row])
        print("Private export written to",file)
