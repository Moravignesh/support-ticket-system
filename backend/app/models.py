from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    agent = "agent"
    admin = "admin"


class TicketPriority(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"


class TicketStatus(str, enum.Enum):
    open = "Open"
    in_progress = "In Progress"
    resolved = "Resolved"
    closed = "Closed"


class NotificationEvent(str, enum.Enum):
    ticket_assigned = "ticket_assigned"
    status_updated = "status_updated"
    new_comment = "new_comment"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.customer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    created_tickets = relationship("Ticket", foreign_keys="Ticket.customer_id", back_populates="customer")
    assigned_tickets = relationship("Ticket", foreign_keys="Ticket.assigned_agent_id", back_populates="assigned_agent")
    comments = relationship("Comment", back_populates="author")
    notifications = relationship("Notification", back_populates="user")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SAEnum(TicketPriority), default=TicketPriority.medium, nullable=False)
    status = Column(SAEnum(TicketStatus), default=TicketStatus.open, nullable=False)

    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="created_tickets")
    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id], back_populates="assigned_tickets")
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="ticket", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", back_populates="comments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    event = Column(SAEnum(NotificationEvent), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="notifications")
    ticket = relationship("Ticket", back_populates="notifications")
