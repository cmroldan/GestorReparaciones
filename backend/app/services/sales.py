from sqlalchemy.orm import Session

from app.exceptions import RecursoNoEncontrado, ReglaNegocioViolada
from app.models.enums import ItemType, MovementType
from app.models.item import Item
from app.models.sale import Sale, SaleItem
from app.schemas.sale import SaleCreate
from app.services.stock import apply_stock_delta

_MSG_VENTA_INEXISTENTE = "No existe la venta solicitada."
_MSG_ITEM_INEXISTENTE = "No existe el ítem solicitado."
_MSG_ITEM_INACTIVO = "El ítem está inactivo para esa operación."
_MSG_ITEM_NO_VENDIBLE = "Solo se pueden vender insumos y accesorios."

_TIPOS_VENDIBLES = (ItemType.SUPPLY, ItemType.ACCESSORY)


def create_sale(session: Session, data: SaleCreate) -> Sale:
    """Crea una venta calculando el total en el servidor.

    Los centavos se calculan con el precio actual de cada ítem; cualquier
    total enviado por el cliente se ignora. Ante cualquier fallo se revierte
    la operación completa: no quedan venta, ítems de venta, cambios de stock
    ni movimientos a mitad de camino.
    """
    sale = Sale(total_cents=0)
    session.add(sale)
    session.flush()  # obtiene el id para las referencias de stock
    try:
        total_cents = 0
        for entry in data.items:
            item = session.get(Item, entry.item_id)
            if item is None:
                raise RecursoNoEncontrado(_MSG_ITEM_INEXISTENTE)
            if not item.active:
                raise ReglaNegocioViolada(_MSG_ITEM_INACTIVO)
            if item.type not in _TIPOS_VENDIBLES:
                raise ReglaNegocioViolada(_MSG_ITEM_NO_VENDIBLE)

            # Delta negativo: la ausencia de stock (o el ítem inactivo) hace
            # fallar el UPDATE y aborta toda la venta.
            apply_stock_delta(
                session,
                item_id=item.id,
                movement_type=MovementType.SALE,
                delta=-entry.quantity,
                reference_type="sale",
                reference_id=sale.id,
                require_active=True,
            )

            unit_price_cents = item.price_cents
            subtotal_cents = entry.quantity * unit_price_cents
            session.add(SaleItem(
                sale_id=sale.id,
                item_id=item.id,
                quantity=entry.quantity,
                unit_price_cents=unit_price_cents,
                subtotal_cents=subtotal_cents,
            ))
            total_cents += subtotal_cents

        sale.total_cents = total_cents
        session.flush()
        session.commit()
    except Exception:
        session.rollback()
        raise
    return sale


def get_sale(session: Session, sale_id: int) -> Sale:
    sale = session.get(Sale, sale_id)
    if sale is None:
        raise RecursoNoEncontrado(_MSG_VENTA_INEXISTENTE)
    return sale
