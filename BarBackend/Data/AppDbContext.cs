using Microsoft.EntityFrameworkCore;
using BarBackend.Models;

namespace BarBackend.Data;

public class AppDbContext : DbContext
{
	public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
	{
	}

	public DbSet<Mesa> Mesas { get; set; }
	public DbSet<Producto> Productos { get; set; }
    public DbSet<Comanda> Comandas { get; set; }
    public DbSet<DetalleComanda> DetallesComandas { get; set; }
}