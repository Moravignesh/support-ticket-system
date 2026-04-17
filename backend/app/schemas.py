from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, TicketPriority, TicketStatus, NotificationEvent


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.customer

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Ticket Schemas ────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: Optional[TicketPriority] = TicketPriority.medium


class TicketAssign(BaseModel):
    agent_id: int


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    priority: TicketPriority
    status: TicketStatus
    customer_id: int
    assigned_agent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    customer: Optional[UserOut] = None
    assigned_agent: Optional[UserOut] = None
    resolution_time_hours: Optional[float] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_resolution(cls, ticket):
        data = cls.model_validate(ticket)
        if ticket.resolved_at and ticket.created_at:
            delta = ticket.resolved_at - ticket.created_at
            data.resolution_time_hours = round(delta.total_seconds() / 3600, 2)
        return data


# ─── Comment Schemas ───────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    message: str


class CommentOut(BaseModel):
    id: int
    message: str
    ticket_id: int
    author_id: int
    created_at: datetime
    author: Optional[UserOut] = None

    model_config = {"from_attributes": True}


# ─── Notification Schemas ──────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    user_id: int
    ticket_id: Optional[int] = None
    event: NotificationEvent
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Admin Analytics ───────────────────────────────────────────────────────────

class AnalyticsOut(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    avg_resolution_time_hours: Optional[float]
    tickets_by_priority: dict
    recent_tickets: List[TicketOut]
