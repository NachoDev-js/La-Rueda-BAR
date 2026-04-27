<img width="1907" height="947" alt="image" src="https://github.com/user-attachments/assets/45595ddd-5b06-4344-9e9e-b3b6aceaa68c" />

<img width="1899" height="948" alt="image" src="https://github.com/user-attachments/assets/ddd52b46-1f61-45e0-a798-5e22b7406561" />

<img width="1915" height="946" alt="image" src="https://github.com/user-attachments/assets/ecc95c7e-77f8-4057-ae53-2669f02f6591" />

<img width="1913" height="946" alt="image" src="https://github.com/user-attachments/assets/c33ad4d6-7be5-4549-9d02-89f3d58c3e8d" />

<img width="1917" height="948" alt="image" src="https://github.com/user-attachments/assets/a9d48d97-4a1a-4b08-83b1-99ec204d532d" />


🎡 La Rueda BAR - Sistema de Gestión

Sistema integral de gestión para bares y restaurantes, diseñado para optimizar la toma de pedidos, control de stock y seguimiento de estadísticas de ventas en tiempo real.

🚀 Características principales

-Gestión de Mesas

-Comandas en tiempo real

-Control de Stock

-Panel de Estadísticas

-Multiplataforma: Gracias a Docker, el sistema funciona en Windows, macOS y Linux sin configuraciones complejas.

🛠️ Tecnologías utilizadas

Frontend:

-Angular 17+

-TypeScript

-Bootstrap

Backend

-ASP.NET Core 10.0

-Entity Framework Core

-SQLite

Deployment

-Docker & Docker Compose

-Git Bash / GitHub Actions: Control de versiones.

📦 Instalación y Ejecución

Para levantar el proyecto localmente, solo necesitas tener instalado Docker Desktop.

Clonar el repositorio:

En Bash:

git clone https://github.com/tu-usuario/la-rueda-bar.git

cd la-rueda-bar


Levantar el contenedor:

Bash

docker-compose up -d --build


Acceder al sistema:

Abre tu navegador en: http://localhost:5000

📂 Estructura del Proyecto

/BarBackend: Código fuente de la API en .NET Core.

/BarFrontend: Código fuente de la interfaz en Angular. 

/publish_docker: Archivos listos para producción y despliegue en Mac/Linux.

docker-compose.yml: Configuración de orquestación del contenedor.

NOTA

Asegurarse de copiar el archivo BarDatabase.db dentro del publish_docker
