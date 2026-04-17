from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models import Comment, Ticket, Notification, User, UserRole, NotificationEvent
from app.schemas import CommentCreate, CommentOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/tickets", tags=["Comments"])


def _notify(db: Session, user_id: int, ticket_id: int, event: NotificationEvent, message: str):
    notif = Notification(user_id=user_id, ticket_id=ticket_id, event=event, message=message)
    db.add(notif)


@router.post("/{ticket_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    ticket_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Customers can only comment on their own tickets
    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    comment = Comment(
        message=payload.message,
        ticket_id=ticket_id,
        author_id=current_user.id,
    )
    db.add(comment)

    # Notify: if customer comments → notify assigned agent/admin
    #         if agent/admin comments → notify customer
    if current_user.role == UserRole.customer:
        if ticket.assigned_agent_id:
            _notify(db, ticket.assigned_agent_id, ticket_id, NotificationEvent.new_comment,
                    f"Customer commented on ticket #{ticket_id}: '{payload.message[:60]}...'")
    else:
        _notify(db, ticket.customer_id, ticket_id, NotificationEvent.new_comment,
                f"New reply on your ticket #{ticket_id}: '{payload.message[:60]}...'")

    db.commit()
    db.refresh(comment)

    comment_with_author = db.query(Comment).options(joinedload(Comment.author)).filter(Comment.id == comment.id).first()
    return comment_with_author


@router.get("/{ticket_id}/comments", response_model=List[CommentOut])
def get_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    comments = (
        db.query(Comment)
        .options(joinedload(Comment.author))
        .filter(Comment.ticket_id == ticket_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return comments
