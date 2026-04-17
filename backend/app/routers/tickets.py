from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models import Ticket, User, Notification, TicketStatus, TicketPriority, UserRole, NotificationEvent
from app.schemas import TicketCreate, TicketOut, TicketAssign, TicketStatusUpdate
from app.dependencies import get_current_user, get_agent_or_admin, get_admin




router = APIRouter(prefix="/tickets", tags=["Tickets"])


def _notify(db: Session, user_id: int, ticket_id: int, event: NotificationEvent, message: str):
    notif = Notification(user_id=user_id, ticket_id=ticket_id, event=event, message=message)
    db.add(notif)


# ─── Create Ticket ─────────────────────────────────────────────────────────────

@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = Ticket(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=TicketStatus.open,
        customer_id=current_user.id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return TicketOut.from_orm_with_resolution(ticket)


# ─── List Tickets ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[TicketOut])
def list_tickets(
    status: Optional[str] = Query(None, description="open | in progress | resolved | closed  (case-insensitive)"),
    priority: Optional[str] = Query(None, description="low | medium | high  (case-insensitive)"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── case-insensitive enum resolution ───────────────────────────────────────
    status_map = {s.value.lower(): s for s in TicketStatus}
    priority_map = {p.value.lower(): p for p in TicketPriority}

    status_filter = None
    if status:
        status_filter = status_map.get(status.strip().lower())
        if status_filter is None:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid status '{status}'. Allowed (case-insensitive): {[s.value for s in TicketStatus]}"
            )

    priority_filter = None
    if priority:
        priority_filter = priority_map.get(priority.strip().lower())
        if priority_filter is None:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid priority '{priority}'. Allowed (case-insensitive): {[p.value for p in TicketPriority]}"
            )

    # ── build query ────────────────────────────────────────────────────────────
    query = db.query(Ticket).options(
        joinedload(Ticket.customer),
        joinedload(Ticket.assigned_agent),
    )

    if current_user.role == UserRole.customer:
        query = query.filter(Ticket.customer_id == current_user.id)
    elif current_user.role == UserRole.agent:
        query = query.filter(
            (Ticket.assigned_agent_id == current_user.id) | (Ticket.assigned_agent_id == None)
        )

    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority_filter:
        query = query.filter(Ticket.priority == priority_filter)
    if search:
        query = query.filter(
            Ticket.title.ilike(f"%{search}%") | Ticket.description.ilike(f"%{search}%")
        )

    query = query.order_by(Ticket.created_at.desc())
    offset = (page - 1) * page_size
    tickets = query.offset(offset).limit(page_size).all()
    return [TicketOut.from_orm_with_resolution(t) for t in tickets]


# ─── Get Single Ticket ─────────────────────────────────────────────────────────

@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).options(
        joinedload(Ticket.customer),
        joinedload(Ticket.assigned_agent),
    ).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Customers can only view their own tickets
    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return TicketOut.from_orm_with_resolution(ticket)


# ─── Assign Ticket ─────────────────────────────────────────────────────────────

@router.patch("/{ticket_id}/assign", response_model=TicketOut)
def assign_ticket(
    ticket_id: int,
    payload: TicketAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    agent = db.query(User).filter(User.id == payload.agent_id, User.role == UserRole.agent).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    ticket.assigned_agent_id = payload.agent_id
    ticket.updated_at = datetime.now(timezone.utc)

    # Notify: agent about assignment, customer about update
    _notify(db, agent.id, ticket.id, NotificationEvent.ticket_assigned,
            f"Ticket #{ticket.id} '{ticket.title}' has been assigned to you.")
    _notify(db, ticket.customer_id, ticket.id, NotificationEvent.ticket_assigned,
            f"Your ticket #{ticket.id} has been assigned to an agent.")

    db.commit()
    db.refresh(ticket)
    return TicketOut.from_orm_with_resolution(ticket)


# ─── Update Status ─────────────────────────────────────────────────────────────

STATUS_FLOW = {
    TicketStatus.open: [TicketStatus.in_progress],
    TicketStatus.in_progress: [TicketStatus.resolved],
    TicketStatus.resolved: [TicketStatus.closed],
    TicketStatus.closed: [],
}


@router.patch("/{ticket_id}/status", response_model=TicketOut)
def update_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_or_admin),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    allowed_next = STATUS_FLOW.get(ticket.status, [])
    if payload.status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{ticket.status.value}' to '{payload.status.value}'. "
                   f"Allowed: {[s.value for s in allowed_next]}",
        )

    old_status = ticket.status
    ticket.status = payload.status
    ticket.updated_at = datetime.now(timezone.utc)

    if payload.status == TicketStatus.resolved:
        ticket.resolved_at = datetime.now(timezone.utc)

    # Notify customer
    _notify(db, ticket.customer_id, ticket.id, NotificationEvent.status_updated,
            f"Ticket #{ticket.id} status changed from '{old_status.value}' to '{payload.status.value}'.")

    db.commit()
    db.refresh(ticket)
    return TicketOut.from_orm_with_resolution(ticket)
