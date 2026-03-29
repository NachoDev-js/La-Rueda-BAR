namespace BarBackend.Models;

public class DetallePedido
{
    public int Id { get; set; }

    // Relación con el Pedido (La cuenta)
    public int PedidoId { get; set; }
    public Pedido? Pedido { get; set; }

    // Relación con el Producto (El menú)
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int Cantidad { get; set; }
    public decimal Subtotal { get; set; }
}