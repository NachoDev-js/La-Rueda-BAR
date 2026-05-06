using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarBackend.Data;
using BarBackend.Models;

namespace BarBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComandasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ComandasController(AppDbContext context)
        {
            _context = context;
        }

        // 1. OBTENER LA CUENTA ACTUAL DE UNA MESA
        [HttpGet("mesa/{mesaId}")]
        public async Task<ActionResult<Comanda>> GetComandaActiva(int mesaId)
        {
            var comanda = await _context.Comandas
                .Include(c => c.Detalles)
                .ThenInclude(d => d.Producto) 
                .FirstOrDefaultAsync(c => c.MesaId == mesaId && c.Estado == "Abierta");

            if (comanda == null)
            {
                return NotFound("Esta mesa no tiene una cuenta abierta.");
            }

            return comanda;
        }

        // 2. ABRIR UNA MESA
        [HttpPost("abrir/{mesaId}")]
        public async Task<ActionResult<Comanda>> AbrirComanda(int mesaId)
        {
            var mesa = await _context.Mesas.FindAsync(mesaId);

            if (mesa == null)
            {
                return NotFound("La mesa solicitada no existe.");
            }

            if (mesa.Estado == "Ocupada")
            {
                return BadRequest("La mesa ya tiene una cuenta abierta.");
            }

            var nuevaComanda = new Comanda
            {
                MesaId = mesaId,
                Estado = "Abierta",
                FechaHoraApertura = DateTime.UtcNow,
                TotalCobrado = 0
            };

            _context.Comandas.Add(nuevaComanda);

            // Actualizamos el estado de la mesa
            mesa.Estado = "Ocupada";

            // Si la mesa es de pool, iniciamos el reloj
            if (mesa.EsPool)
            {
                mesa.HoraInicioPool = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(nuevaComanda);
        }

        // 3. AGREGAR O APILAR UN PRODUCTO A LA CUENTA
        [HttpPost("{comandaId}/agregar")]
        public async Task<ActionResult<DetalleComanda>> AgregarProducto(int comandaId, [FromBody] DetalleRequest request)
        {
            var comanda = await _context.Comandas
                .Include(c => c.Detalles)
                .FirstOrDefaultAsync(c => c.Id == comandaId);

            if (comanda == null || comanda.Estado != "Abierta") return BadRequest("Comanda no válida o cerrada.");

            var producto = await _context.Productos.FindAsync(request.ProductoId);
            if (producto == null) return NotFound("El producto no existe.");

            var detalleExistente = comanda.Detalles.FirstOrDefault(d => d.ProductoId == request.ProductoId);

            if (detalleExistente != null)
            {
                // Si ya existe, sumamos
                detalleExistente.Cantidad += request.Cantidad;
                await _context.SaveChangesAsync();

                // Devolvemos el detalle actualizado (ya tiene ID)
                return Ok(detalleExistente);
            }
            else
            {
                // Si es nuevo, creamos
                var nuevoDetalle = new DetalleComanda
                {
                    ComandaId = comandaId,
                    ProductoId = producto.Id,
                    Cantidad = request.Cantidad,
                    PrecioUnitario = producto.Precio
                };

                _context.DetallesComandas.Add(nuevoDetalle);
                await _context.SaveChangesAsync();

                nuevoDetalle.Producto = producto;

                // DEVOLVEMOS EL OBJETO COMPLETO CON SU NUEVO ID
                return Ok(nuevoDetalle);
            }
        }

        // 4. CERRAR Y COBRAR LA MESA
        [HttpPost("{comandaId}/cerrar")]
        public async Task<IActionResult> CerrarComanda(int comandaId, [FromQuery] string metodoPago = "Efectivo")
        {
            var comanda = await _context.Comandas
                .Include(c => c.Detalles)
                .FirstOrDefaultAsync(c => c.Id == comandaId);

            if (comanda == null || comanda.Estado != "Abierta") return BadRequest("Comanda no válida.");

            foreach (var detalle in comanda.Detalles)
            {
                await DescontarStock(detalle.ProductoId, detalle.Cantidad);
            }

            var mesa = await _context.Mesas.FindAsync(comanda.MesaId);
            decimal recargoPool = 0;

            if (mesa != null)
            {
                mesa.Estado = "Libre";

                if (mesa.EsPool && mesa.HoraInicioPool.HasValue)
                {
                    double minutos = (DateTime.Now - mesa.HoraInicioPool.Value).TotalMinutes;
                    decimal precioPorFraccion = 6000m;

                    int fracciones = (int)Math.Ceiling(minutos / 30.0);
                    if (fracciones == 0) fracciones = 1;

                    recargoPool = fracciones * precioPorFraccion;
                    mesa.HoraInicioPool = null;
                }
            } 

            comanda.TotalCobrado = comanda.Detalles.Sum(d => d.Subtotal) + recargoPool;
            comanda.Estado = "Cobrada";
            comanda.FechaHoraCierre = DateTime.Now;
            comanda.MetodoPago = metodoPago;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Cobrado exitosamente", total = comanda.TotalCobrado });
        }

        // 5. VENTA RÁPIDA DE MOSTRADOR (Takeaway)
        [HttpPost("venta-rapida")]
        public async Task<IActionResult> ProcesarVentaRapida([FromBody] List<DetalleRequest> detalles, [FromQuery] string metodoPago = "Efectivo")
        {
            if (detalles == null || !detalles.Any())
                return BadRequest("La venta no tiene productos.");

            var mesaMostrador = await _context.Mesas.FirstOrDefaultAsync(m => m.Sector == "Barra");
            if (mesaMostrador == null)
            {
                mesaMostrador = new Mesa { Numero = 999, Sector = "Barra", Estado = "Libre", EsPool = false };
                _context.Mesas.Add(mesaMostrador);
                await _context.SaveChangesAsync();
            }

            var nuevaComanda = new Comanda
            {
                MesaId = mesaMostrador.Id,
                Estado = "Cobrada",
                MetodoPago = metodoPago,
                FechaHoraApertura = DateTime.Now,
                FechaHoraCierre = DateTime.Now,
                TotalCobrado = 0
            };

            _context.Comandas.Add(nuevaComanda);
            await _context.SaveChangesAsync();

            decimal totalCobrado = 0;
            foreach (var item in detalles)
            {
                var producto = await _context.Productos.FindAsync(item.ProductoId);
                if (producto != null)
                {
                    totalCobrado += (item.Cantidad * producto.Precio);
                    producto.StockActual -= item.Cantidad;

                    _context.DetallesComandas.Add(new DetalleComanda
                    {
                        ComandaId = nuevaComanda.Id,
                        ProductoId = producto.Id,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = producto.Precio
                    });
                }
            }

            nuevaComanda.TotalCobrado = totalCobrado;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Venta de mostrador registrada con éxito", total = totalCobrado });
        }





        [HttpDelete("detalle/{detalleId}")]
        public async Task<IActionResult> EliminarDetalle(int detalleId)
        {
            var detalle = await _context.DetallesComandas.FindAsync(detalleId);
            if (detalle == null) return NotFound();

            _context.DetallesComandas.Remove(detalle);
            await _context.SaveChangesAsync();
            return Ok();
        }

        private async Task DescontarStock(int productoId, int cantidad)
        {
            var producto = await _context.Productos.FindAsync(productoId);
            if (producto != null)
            {
                producto.StockActual -= cantidad; // Restamos lo vendido
                if (producto.StockActual < 0) producto.StockActual = 0; // Evitamos stock negativo
                _context.Entry(producto).State = EntityState.Modified;
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var hoy = DateTime.Now.Date; // Fecha de hoy a las 00:00:00

            // Calculamos el lunes de esta semana
            int diff = (7 + (DateTime.Now.DayOfWeek - DayOfWeek.Monday)) % 7;
            var inicioSemana = hoy.AddDays(-1 * diff);

            var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);

            // Traemos solo las cobradas que tengan fecha de cierre
            var comandas = await _context.Comandas
                .Where(c => c.Estado == "Cobrada" && c.FechaHoraCierre != null)
                .ToListAsync();

            var stats = new
            {
                // Usamos .Value.Date para comparar solo Día/Mes/Año sin la hora
                Hoy = comandas.Where(c => c.FechaHoraCierre.Value.Date == hoy).Sum(c => c.TotalCobrado),
                Semana = comandas.Where(c => c.FechaHoraCierre.Value.Date >= inicioSemana).Sum(c => c.TotalCobrado),
                Mes = comandas.Where(c => c.FechaHoraCierre.Value.Date >= inicioMes).Sum(c => c.TotalCobrado),
                CantidadVentasHoy = comandas.Count(c => c.FechaHoraCierre.Value.Date == hoy)
            };

            return Ok(stats);
        }

        [HttpGet("stats-custom")]
        public async Task<IActionResult> GetStatsCustom([FromQuery] DateTime? fecha, [FromQuery] int? mes, [FromQuery] int? anio)
        {
            var query = _context.Comandas
                .Where(c => c.Estado == "Cobrada" && c.FechaHoraCierre != null);

            // Si filtran por un día específico
            if (fecha.HasValue)
            {
                var f = fecha.Value.Date;
                query = query.Where(c => c.FechaHoraCierre.Value.Date == f);
            }
            // Si filtran por mes y año
            else if (mes.HasValue && anio.HasValue)
            {
                query = query.Where(c => c.FechaHoraCierre.Value.Month == mes && c.FechaHoraCierre.Value.Year == anio);
            }
            else
            {
                // Por defecto: Hoy
                var hoy = DateTime.Now.Date;
                query = query.Where(c => c.FechaHoraCierre.Value.Date == hoy);
            }

            var resultados = await query.ToListAsync();

            return Ok(new
            {
                Total = resultados.Sum(c => c.TotalCobrado),
                Cantidad = resultados.Count,
                Detalle = resultados.Select(c => new { c.Id, c.TotalCobrado, c.FechaHoraCierre, c.MetodoPago })
            });
        }


    }

    // Un DTO chiquito para recibir los datos de Angular limpio
    public class DetalleRequest
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
    }
}