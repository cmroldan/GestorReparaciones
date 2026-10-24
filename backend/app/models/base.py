from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum as SaEnum, TypeDecorator


def utcnow() -> datetime:
    return datetime.now(UTC)


def sa_enum(enum_cls: type, name: str) -> SaEnum:
    """Enum como VARCHAR validado por la aplicación.

    Se persisten los *valores* del enum (no los nombres) y se evita el
    constraint automático de Enum para que la validación quede en Python.
    """
    return SaEnum(
        enum_cls,
        name=name,
        values_callable=lambda cls: [member.value for member in cls],
        native_enum=False,
        validate_strings=True,
    )


class UTCDateTime(TypeDecorator):
    """DateTime en UTC: se persiste sin zona horaria (UTC) y se
    recupera con tzinfo UTC."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return value.replace(tzinfo=UTC)
