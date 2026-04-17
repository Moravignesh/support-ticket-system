"""
Seed script — creates demo users and sample tickets.
Run: python seed.py  (from backend/ folder, after pip install)
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models import User, Ticket, Comment, UserRole, TicketPriority, TicketStatus
from app.auth import hash_password
from datetime import datetime, timezone, timedelta

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Demo Users ────────────────────────────────────────────────────────────────
users_data = [
    dict(name="Admin User",    email="admin@demo.com",    password="admin123",    role=UserRole.admin),
    dict(name="Agent Alice",   email="agent@demo.com",    password="agent123",    role=UserRole.agent),
    dict(name="Agent Bob",     email="agent2@demo.com",   password="agent123",    role=UserRole.agent),
    dict(name="Customer John", email="customer@demo.com", password="customer123", role=UserRole.customer),
    dict(name="Customer Jane", email="customer2@demo.com",password="customer123", role=UserRole.customer),
]

created_users = {}
for u in users_data:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if not existing:
        user = User(name=u["name"], email=u["email"], hashed_password=hash_password(u["password"]), role=u["role"])
        db.add(user)
        db.flush()
        created_users[u["email"]] = user
        print(f"  ✓ Created user: {u['email']} ({u['role'].value})")
    else:
        created_users[u["email"]] = existing
        print(f"  ~ Skipped (exists): {u['email']}")

db.commit()

admin   = created_users["admin@demo.com"]
agent1  = created_users["agent@demo.com"]
agent2  = created_users["agent2@demo.com"]
cust1   = created_users["customer@demo.com"]
cust2   = created_users["customer2@demo.com"]

# ── Sample Tickets ─────────────────────────────────────────────────────────────
tickets_data = [
    dict(title="Cannot login to portal", description="Getting 'Invalid credentials' even with correct password. Tried resetting but no luck.", priority=TicketPriority.high, status=TicketStatus.open, customer=cust1),
    dict(title="Payment not processed", description="Paid via credit card but order shows 'Pending'. Transaction ID: TXN-98765.", priority=TicketPriority.high, status=TicketStatus.in_progress, customer=cust1, agent=agent1),
    dict(title="Feature request: Dark Mode", description="Would love a dark mode option for the dashboard.", priority=TicketPriority.low, status=TicketStatus.open, customer=cust2),
    dict(title="Export to CSV broken", description="The CSV export button does nothing on Firefox. Works in Chrome.", priority=TicketPriority.medium, status=TicketStatus.resolved, customer=cust1, agent=agent2,
         resolved_at=datetime.now(timezone.utc) - timedelta(hours=3)),
    dict(title="Email notifications not arriving", description="Haven't received any email for the past 2 days. Checked spam.", priority=TicketPriority.medium, status=TicketStatus.closed, customer=cust2, agent=agent1,
         resolved_at=datetime.now(timezone.utc) - timedelta(days=1)),
    dict(title="Dashboard loads very slowly", description="Takes 20+ seconds to load. Started after last update.", priority=TicketPriority.high, status=TicketStatus.in_progress, customer=cust1, agent=agent1),
]

for td in tickets_data:
    t = Ticket(
        title=td["title"],
        description=td["description"],
        priority=td["priority"],
        status=td["status"],
        customer_id=td["customer"].id,
        assigned_agent_id=td.get("agent", None) and td["agent"].id,
        resolved_at=td.get("resolved_at"),
    )
    db.add(t)
    db.flush()

    # Add sample comments
    db.add(Comment(message="Thank you for reporting this. We're looking into it.", ticket_id=t.id,
                   author_id=td.get("agent", admin).id))
    if td["status"] in [TicketStatus.resolved, TicketStatus.closed]:
        db.add(Comment(message="This issue has been resolved. Please let us know if it recurs.", ticket_id=t.id,
                       author_id=td.get("agent", admin).id))
    print(f"  ✓ Created ticket: #{t.id} — {td['title']}")

db.commit()
db.close()

print("\n✅ Seed complete! Demo accounts:")
print("   admin@demo.com     / admin123    (Admin)")
print("   agent@demo.com     / agent123    (Support Agent)")
print("   agent2@demo.com    / agent123    (Support Agent)")
print("   customer@demo.com  / customer123 (Customer)")
print("   customer2@demo.com / customer123 (Customer)")
