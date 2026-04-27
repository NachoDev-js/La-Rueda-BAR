namespace BarBackend.Models;

public class Producto
{
	public int Id { get; set; }
	public string Nombre { get; set; } = string.Empty;
	public decimal Precio { get; set; }
	public string Categoria { get; set; } = string.Empty;
    public int StockActual { get; set; } = 0;
    public int StockMinimo { get; set; } = 5;
}