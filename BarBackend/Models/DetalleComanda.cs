namespace BarBackend.Models
{
    public class DetalleComanda
    {
        public int Id { get; set; }

        public int ComandaId { get; set; }
        public Comanda Comanda { get; set; }

        public int ProductoId { get; set; }
        public Producto Producto { get; set; }

        public int Cantidad { get; set; }

        public decimal PrecioUnitario { get; set; }

        public decimal Subtotal => Cantidad * PrecioUnitario;
    }
}