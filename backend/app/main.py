from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.error_handlers import register_exception_handlers
from app.routers import clients, equipments, health, items

app = FastAPI(title="Taller de Reparaciones")
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(equipments.router, prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
