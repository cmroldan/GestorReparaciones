from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, DateTime, Enum as SaEnum, TypeDecorator


def utcnow() -> datetime:
    return datetime.now(UTC)


def sa_enum(enum_cls: type, name: str) -> SaEnum:
    """Enum como VARCHAR validado por la aplicación.

    Se persisten los *valores* del enum (no los nombres). Validación ORM
    por `validate_strings`; a nivel de base, el CHECK se agrega
    explícitamente con `enum_check` (defensa en profundidad contra SQL
    crudo o inserciones en bloque).
    """
    return SaEnum(
        enum_cls,
        name=name,
        values_callable=lambda cls: [member.value for member in cls],
        native_enum=False,
        validate_strings=True,
    )


def enum_check(enum_cls: type, table_name: str, column_name: str,
               nullable: bool = False) -> CheckConstraint:
    """CHECK que restringe una columna a los valores de un enum.

    El nombre es `<tabla>_<columna>` y único por columna. Si la columna
    admite NULL, el CHECK lo permite explícitamente.
    """
    values = ", ".join(f"'{member.value}'" for member in enum_cls)
    condition = f"{column_name} IN ({values})" if not nullable \
        else f"({column_name} IS NULL OR {column_name} IN ({values}))"
    return CheckConstraint(
        condition,
        name=f"ck_{table_name}_{column_name}_valid",
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
