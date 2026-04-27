# 1. Imagen base de .NET para correr la app
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5000

# 2. Imagen del SDK para compilar
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["BarBackend.csproj", "./"]
RUN dotnet restore "BarBackend.csproj"
COPY . .
RUN dotnet publish "BarBackend.csproj" -c Release -o /app/publish

# 3. Configuración final
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY wwwroot/ ./wwwroot/
COPY BarDatabase.db .

ENTRYPOINT ["dotnet", "BarBackend.dll", "--urls=http://0.0.0.0:5000"]