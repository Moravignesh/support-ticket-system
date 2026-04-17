from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, tickets, comments, admin, notifications

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Support Ticket System",
    description="A full-stack support ticket management system with role-based access control.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(comments.router)
app.include_router(admin.router)
app.include_router(notifications.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Customer Support Ticket System API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
