from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import Ticket, User, TicketStatus, TicketPriority, UserRole
from app.schemas import AnalyticsOut, TicketOut, UserOut
from app.dependencies import get_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    total = db.query(Ticket).count()
    open_count = db.query(Ticket).filter(Ticket.status == TicketStatus.open).count()
    in_progress_count = db.query(Ticket).filter(Ticket.status == TicketStatus.in_progress).count()
    resolved_count = db.query(Ticket).filter(Ticket.status == TicketStatus.resolved).count()
    closed_count = db.query(Ticket).filter(Ticket.status == TicketStatus.closed).count()

    # Average resolution time
    resolved_tickets = db.query(Ticket).filter(
        Ticket.resolved_at != None,
        Ticket.created_at != None
    ).all()

    avg_resolution = None
    if resolved_tickets:
        total_hours = sum(
            (t.resolved_at - t.created_at).total_seconds() / 3600
            for t in resolved_tickets
            if t.resolved_at and t.created_at
        )
        avg_resolution = round(total_hours / len(resolved_tickets), 2)

    # Tickets by priority
    by_priority = {}
    for priority in TicketPriority:
        count = db.query(Ticket).filter(Ticket.priority == priority).count()
        by_priority[priority.value] = count

    # Recent tickets (last 10)
    recent = (
        db.query(Ticket)
        .options(joinedload(Ticket.customer), joinedload(Ticket.assigned_agent))
        .order_by(Ticket.created_at.desc())
        .limit(10)
        .all()
    )

    return AnalyticsOut(
        total_tickets=total,
        open_tickets=open_count,
        in_progress_tickets=in_progress_count,
        resolved_tickets=resolved_count,
        closed_tickets=closed_count,
        avg_resolution_time_hours=avg_resolution,
        tickets_by_priority=by_priority,
        recent_tickets=[TicketOut.from_orm_with_resolution(t) for t in recent],
    )


@router.get("/agents", response_model=List[UserOut])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    agents = db.query(User).filter(User.role == UserRole.agent, User.is_active == True).all()
    return agents


@router.get("/users", response_model=List[UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users
