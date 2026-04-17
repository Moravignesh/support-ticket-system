# 🎫 Customer Support Ticket Management System

A full-stack support ticket system built with **FastAPI** (backend) and **React** (frontend), featuring role-based access control, ticket lifecycle management, SLA tracking, real-time notifications, and an admin analytics dashboard.

---
## Demo videos

frontend video : https://drive.google.com/file/d/1FDrYzF8n1nO6nJEPOyN6UWgExv_KdYX_/view?usp=sharing

backend video : https://drive.google.com/file/d/1FDrYzF8n1nO6nJEPOyN6UWgExv_KdYX_/view?usp=sharing

## 📁 Project Structure

```
support-ticket-system/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # ORM models (User, Ticket, Comment, Notification)
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT + bcrypt utilities
│   │   ├── dependencies.py    # Auth dependencies & role guards
│   │   └── routers/
│   │       ├── auth.py        # /auth/* endpoints
│   │       ├── tickets.py     # /tickets/* endpoints
│   │       ├── comments.py    # /tickets/{id}/comments endpoints
│   │       ├── admin.py       # /admin/* endpoints
│   │       └── notifications.py # /notifications endpoints
│   ├── seed.py                # Demo data seeder
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.jsx            # Router setup
    │   ├── main.jsx           # Entry point
    │   ├── api/axios.js       # Axios instance with interceptors
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── TicketCard.jsx
    │   │   └── PrivateRoute.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Tickets.jsx
    │       ├── TicketDetail.jsx
    │       ├── CreateTicket.jsx
    │       ├── AdminDashboard.jsx
    │       └── Notifications.jsx
    ├── package.json
    └── vite.config.js
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed demo data (optional but recommended)
python seed.py

# Start server
uvicorn app.main:app --reload --port 8000
```

The API is now running at: **http://localhost:8000**
Swagger docs: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend is now running at: **http://localhost:5173**

---

## 🔐 Demo Accounts

| Email                  | Password     | Role           |
|------------------------|--------------|----------------|
| admin@demo.com         | admin123     | Admin          |
| agent@demo.com         | agent123     | Support Agent  |
| agent2@demo.com        | agent123     | Support Agent  |
| customer@demo.com      | customer123  | Customer       |
| customer2@demo.com     | customer123  | Customer       |

---

## 🗄️ Database Schema

```
users
  id, name, email, hashed_password, role (customer|agent|admin),
  is_active, created_at

tickets
  id, title, description, priority (Low|Medium|High),
  status (Open|In Progress|Resolved|Closed),
  customer_id (FK→users), assigned_agent_id (FK→users),
  created_at, updated_at, resolved_at

comments
  id, message, ticket_id (FK→tickets), author_id (FK→users),
  created_at

notifications
  id, user_id (FK→users), ticket_id (FK→tickets),
  event (ticket_assigned|status_updated|new_comment),
  message, is_read, created_at
```

---

## 📡 API Documentation

### Authentication

| Method | Endpoint         | Description          | Auth |
|--------|-----------------|----------------------|------|
| POST   | /auth/register  | Register new user    | ❌   |
| POST   | /auth/login     | Login → get JWT      | ❌   |
| GET    | /auth/me        | Get current user     | ✅   |

### Tickets

| Method | Endpoint                    | Description                    | Roles             |
|--------|-----------------------------|--------------------------------|-------------------|
| POST   | /tickets                    | Create ticket                  | All               |
| GET    | /tickets                    | List tickets (role-filtered)   | All               |
| GET    | /tickets/{id}               | Get ticket detail              | All (own only*)   |
| PATCH  | /tickets/{id}/assign        | Assign to agent                | Admin             |
| PATCH  | /tickets/{id}/status        | Update status                  | Agent, Admin      |

*Customers see only their own tickets.

### Ticket Status Flow

```
Open → In Progress → Resolved → Closed
```

Only agents and admins can advance the status.

### Comments

| Method | Endpoint                        | Description        | Auth |
|--------|---------------------------------|--------------------|------|
| POST   | /tickets/{id}/comments          | Add comment        | ✅   |
| GET    | /tickets/{id}/comments          | Get comments       | ✅   |

### Admin

| Method | Endpoint           | Description              | Roles |
|--------|--------------------|--------------------------|-------|
| GET    | /admin/analytics   | System-wide metrics      | Admin |
| GET    | /admin/agents      | List all agents          | Admin |
| GET    | /admin/users       | List all users           | Admin |

### Notifications

| Method | Endpoint                       | Description         | Auth |
|--------|-------------------------------|---------------------|------|
| GET    | /notifications                | List user notifs    | ✅   |
| PATCH  | /notifications/{id}/read      | Mark one as read    | ✅   |
| PATCH  | /notifications/read-all       | Mark all as read    | ✅   |

---

## 🔑 Role Permissions Summary

| Feature                  | Customer | Agent | Admin |
|--------------------------|----------|-------|-------|
| Create ticket            | ✅       | ✅    | ✅    |
| View own tickets         | ✅       | ✅    | ✅    |
| View all tickets         | ❌       | ✅    | ✅    |
| Assign ticket to agent   | ❌       | ❌    | ✅    |
| Update ticket status     | ❌       | ✅    | ✅    |
| Add comments             | ✅       | ✅    | ✅    |
| View admin analytics     | ❌       | ❌    | ✅    |

---

## 🚀 Bonus Features Implemented

- ✅ **SLA tracking** — High/Medium/Low priority targets shown per ticket
- ✅ **Resolution time** — Calculated from `created_at` → `resolved_at`  
- ✅ **Search & filters** — Filter by status, priority, full-text search
- ✅ **Pagination** — `page` + `page_size` query params on ticket list
- ✅ **High priority highlight** — 🔥 badge + red border on high priority cards
- ✅ **Analytics charts** — Pie chart (status) + Bar chart (priority) using Recharts
- ✅ **Notification bell** — Unread count badge in navbar

---

## 🛠 Tech Stack

**Backend:** FastAPI · SQLAlchemy · SQLite · JWT (python-jose) · Passlib/bcrypt · Pydantic v2  
**Frontend:** React 18 · React Router v6 · Axios · Recharts · Vite
