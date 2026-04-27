using System;
using System.Collections.Generic;

namespace BarBackend.Models
{
    public class Comanda
    {
        public int Id { get; set; }
        public int MesaId { get; set; }
        public Mesa Mesa { get; set; } 
        public DateTime FechaHoraApertura { get; set; } = DateTime.Now;
        public DateTime? FechaHoraCierre { get; set; } 
        public string Estado { get; set; } = "Abierta";
        public decimal TotalCobrado { get; set; } = 0;
        public List<DetalleComanda> Detalles { get; set; } = new List<DetalleComanda>();
        public string? MetodoPago { get; set; }
    }
}