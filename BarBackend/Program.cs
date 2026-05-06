using Microsoft.EntityFrameworkCore;
using BarBackend.Data;

var builder = WebApplication.CreateBuilder(args);

// Forzamos el puerto 5000 y el acceso desde cualquier IP (celulares mozos)
builder.WebHost.UseUrls("http://0.0.0.0:5000");

// 1. Configuración de la Base de Datos (Ruta Dinámica)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Este bloque asegura que el .exe siempre encuentre la DB al lado suyo
if (connectionString != null && connectionString.Contains("Data Source="))
{
    var parts = connectionString.Split('=');
    var dbName = parts[1];
    // Combina la ruta donde está el .exe con el nombre de la base
    var dbPath = Path.Combine(AppContext.BaseDirectory, dbName);
    connectionString = $"Data Source={dbPath}";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// 2. CORS (Agregamos el puerto 5000 por las dudas)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:5000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 1. Archivos estáticos primero (Frontend)
app.UseDefaultFiles();
app.UseStaticFiles();

// 2. Swagger solo en desarrollo
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 3. Rutas y seguridad
// app.UseHttpsRedirection(); // Comentalo si no hay certificado SSL en el bar, evita errores 500
app.UseCors("PermitirAngular");
app.UseAuthorization();

// 4. Mapeo de controladores y el Fallback para Angular
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();