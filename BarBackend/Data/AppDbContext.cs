using Microsoft.EntityFrameworkCore;
using BarBackend.Models;

namespace BarBackend.Data;

public class AppDbContext : DbContext
{
	// Este constructor recibe las opciones (como la ruta de la base de datos) 
	// y se las pasa a la clase base (DbContext de Entity Framework)
	public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
	{
	}

	// Los DbSet representan las tablas reales en tu base de datos
	public DbSet<Mesa> Mesas { get; set; }
	public DbSet<Producto> Productos { get; set; }
	public DbSet<Pedido> Pedidos { get; set; }
	public DbSet<DetallePedido> DetallesPedido { get; set; }
}