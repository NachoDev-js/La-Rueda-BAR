namespace BarBackend.Models;

public class Mesa
{
    public int Id { get; set; }
    public int Numero { get; set; }
    public string Estado { get; set; } = "Libre";
    public string Sector { get; set; }
    public bool EsPool { get; set; } = false;
    public DateTime? HoraInicioPool { get; set; }
    public int Orden { get; set; } = 0;
}