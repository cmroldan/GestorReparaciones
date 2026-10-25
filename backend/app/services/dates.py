"""Conversión de fechas locales a intervalos UTC para el backend del taller."""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.config import TIMEZONE

_LOCAL_TZ = ZoneInfo(TIMEZONE)


def local_date_range_to_utc(
    from_date: date | None, to_date: date | None
) -> tuple[datetime | None, datetime | None]:
    """Convierte fechas locales (inclusivas) en un intervalo UTC semiabierto.

    Devuelve `(start, end)`; el extremo inicial es inclusivo (medianoche local
    del primer día en la zona `TIMEZONE`) y el final es exclusivo (medianoche
    local del día siguiente al último, convertida a UTC). `None` se mantiene
    como límite abierto.
    """
    start: datetime | None = None
    if from_date is not None:
        start = datetime.combine(from_date, time.min, tzinfo=_LOCAL_TZ).astimezone(UTC)
    end: datetime | None = None
    if to_date is not None:
        end = datetime.combine(to_date + timedelta(days=1), time.min, tzinfo=_LOCAL_TZ)
        end = end.astimezone(UTC)
    return start, end
