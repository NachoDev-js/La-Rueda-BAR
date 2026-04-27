using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarBackend.Migrations
{
    /// <inheritdoc />
    public partial class AgregarMetodoPago : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MetodoPago",
                table: "Comandas",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MetodoPago",
                table: "Comandas");
        }
    }
}
