from enum import Enum, unique


@unique
class EquipmentType(str, Enum):
    NOTEBOOK = "notebook"
    DESKTOP = "desktop"
    PRINTER = "printer"


@unique
class OrderStatus(str, Enum):
    INGRESADO = "ingresado"
    EN_DIAGNOSTICO = "en_diagnostico"
    PRESUPUESTADO = "presupuestado"
    EN_REPARACION = "en_reparacion"
    LISTO = "listo"
    ENTREGADO = "entregado"


@unique
class ItemType(str, Enum):
    PART = "part"
    SUPPLY = "supply"
    ACCESSORY = "accessory"


@unique
class MovementType(str, Enum):
    ENTRY = "entry"
    ADJUSTMENT = "adjustment"
    ORDER_CONSUMPTION = "order_consumption"
    SALE = "sale"
