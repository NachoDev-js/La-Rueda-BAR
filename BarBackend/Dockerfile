# Usamos solo el runtime (mucho más liviano)
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
EXPOSE 5000

# Copiamos el contenido de la carpeta actual (donde ya están las DLLs)
COPY . .

# Arrancamos la DLL directamente
ENTRYPOINT ["dotnet", "BarBackend.dll", "--urls=http://0.0.0.0:5000"]