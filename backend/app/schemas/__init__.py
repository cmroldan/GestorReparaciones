"""Esquemas Pydantic v2 compartidos por los routers y servicios."""

from app.schemas.client import ClientCreate, ClientDetail, ClientRead, ClientUpdate
from app.schemas.common import Money, NonZeroDelta, PositiveQuantity
from app.schemas.equipment import (
    EquipmentCreate,
    EquipmentDetail,
    EquipmentRead,
    EquipmentUpdate,
    EquipmentWithOrderCount,
)
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate
from app.schemas.sale import (
    SaleCreate,
    SaleItemCreate,
    SaleItemRead,
    SaleListResponse,
    SaleRead,
)
from app.schemas.service_order import (
    ConsumptionCreate,
    ConsumptionRead,
    OrderStatusHistoryRead,
    ServiceOrderCreate,
    ServiceOrderDetail,
    ServiceOrderRead,
    ServiceOrderSummary,
    ServiceOrderUpdate,
    StatusChange,
)
from app.schemas.stock_movement import StockMovementCreate, StockMovementRead
from app.schemas.work_log import WorkLogCreate, WorkLogRead

__all__ = [
    "Money",
    "NonZeroDelta",
    "PositiveQuantity",
    "ClientCreate",
    "ClientRead",
    "ClientUpdate",
    "ClientDetail",
    "EquipmentCreate",
    "EquipmentDetail",
    "EquipmentRead",
    "EquipmentUpdate",
    "EquipmentWithOrderCount",
    "ItemCreate",
    "ItemRead",
    "ItemUpdate",
    "StockMovementCreate",
    "StockMovementRead",
    "ServiceOrderCreate",
    "ServiceOrderUpdate",
    "StatusChange",
    "ServiceOrderRead",
    "ServiceOrderSummary",
    "OrderStatusHistoryRead",
    "WorkLogCreate",
    "WorkLogRead",
    "ConsumptionCreate",
    "ConsumptionRead",
    "ServiceOrderDetail",
    "SaleCreate",
    "SaleItemCreate",
    "SaleItemRead",
    "SaleRead",
    "SaleListResponse",
]
