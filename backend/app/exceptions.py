class DomainError(Exception):
    """Error de dominio con un mensaje pensado para mostrarse al usuario."""

    def __init__(self, mensaje: str) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje


class RecursoNoEncontrado(DomainError):
    """El recurso solicitado no existe."""


class RecursoDuplicado(DomainError):
    """El recurso a crear entra en conflicto con uno existente."""


class ReglaNegocioViolada(DomainError):
    """La operación solicitada infringe una regla del negocio."""


class StockInsuficiente(ReglaNegocioViolada):
    """No hay stock suficiente para cubrir el movimiento solicitado."""


class TransicionInvalida(ReglaNegocioViolada):
    """El cambio de estado solicitado no está permitido."""
