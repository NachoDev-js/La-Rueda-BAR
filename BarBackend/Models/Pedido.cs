namespace BarBackend.Models;

public class Pedido
{
    public int Id { get; set; }

    // Clave foránea y propiedad de navegación hacia la Mesa
    public int MesaId { get; set; }
    public Mesa? Mesa { get; set; }

    public DateTime FechaApertura { get; set; } = DateTime.Now;
    public DateTime? FechaCierre { get; set; } // El "?" significa que puede ser nulo (hasta que paguen)

    public decimal Total { get; set; }
    public string Estado { get; set; } = "Abierto"; // "Abierto", "Cobrado", "Cancelado"

    // Relación con los productos consumidos
    public List<DetallePedido> Detalles { get; set; } = new List<DetallePedido>();
}