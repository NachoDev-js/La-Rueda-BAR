namespace BarBackend.Models;

public class Mesa
{
    public int Id { get; set; }
    public int Numero { get; set; }
    public string Estado { get; set; } = "Libre"; // Puede ser "Libre" u "Ocupada"
}