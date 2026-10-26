from app.models.client import Client
from app.models.equipment import Equipment
from app.models.enums import EquipmentType, ItemType, OrderStatus
from app.models.item import Item
from app.models.order_status_history import OrderStatusHistory
from app.models.service_order import ServiceOrder
from app.seed import seed


def test_seed_is_idempotent(db_session):
    seed(db_session); db_session.commit()
    first = (
        db_session.query(Client).count(),
        db_session.query(Equipment).count(),
        db_session.query(Item).count(),
        db_session.query(ServiceOrder).count(),
    )
    seed(db_session); db_session.commit()
    second = (
        db_session.query(Client).count(),
        db_session.query(Equipment).count(),
        db_session.query(Item).count(),
        db_session.query(ServiceOrder).count(),
    )
    assert first == second


def test_seed_creates_the_demo_data(db_session):
    seed(db_session)
    db_session.commit()

    clients = {client.document: client for client in db_session.query(Client)}
    assert set(clients) == {"30111222", "28999888"}
    assert (clients["30111222"].first_name, clients["30111222"].last_name) == (
        "Ana",
        "Pérez",
    )
    assert clients["30111222"].email == "ana@example.com"
    assert (clients["28999888"].first_name, clients["28999888"].last_name) == (
        "Bruno",
        "Gómez",
    )
    assert clients["28999888"].email == "bruno@example.com"

    equipments = db_session.query(Equipment).all()
    assert len(equipments) == 2
    assert {(equipment.client_id, equipment.type) for equipment in equipments} == {
        (clients["30111222"].id, EquipmentType.NOTEBOOK),
        (clients["28999888"].id, EquipmentType.PRINTER),
    }

    items = {item.code: item for item in db_session.query(Item)}
    assert set(items) == {"REP-001", "INS-001", "ACC-001"}
    assert (items["REP-001"].type, items["REP-001"].stock) == (ItemType.PART, 10)
    assert (items["INS-001"].type, items["INS-001"].stock) == (ItemType.SUPPLY, 20)
    assert (items["ACC-001"].type, items["ACC-001"].stock) == (
        ItemType.ACCESSORY,
        5,
    )

    notebook = next(
        equipment
        for equipment in equipments
        if equipment.type is EquipmentType.NOTEBOOK
    )
    order = db_session.query(ServiceOrder).one()
    assert order.number == "ORD-000001"
    assert order.client_id == clients["30111222"].id
    assert order.equipment_id == notebook.id
    assert order.status is OrderStatus.EN_REPARACION
    assert order.diagnosis
    assert order.budget_amount_cents is not None
    assert order.budget_amount_cents >= 0

    history = (
        db_session.query(OrderStatusHistory)
        .filter_by(service_order_id=order.id)
        .order_by(OrderStatusHistory.id)
        .all()
    )
    assert [(row.from_status, row.to_status) for row in history] == [
        (None, OrderStatus.INGRESADO),
        (OrderStatus.INGRESADO, OrderStatus.EN_DIAGNOSTICO),
        (OrderStatus.EN_DIAGNOSTICO, OrderStatus.PRESUPUESTADO),
        (OrderStatus.PRESUPUESTADO, OrderStatus.EN_REPARACION),
    ]

    seed(db_session)
    db_session.commit()
    assert (
        db_session.query(OrderStatusHistory)
        .filter_by(service_order_id=order.id)
        .count()
        == 4
    )
