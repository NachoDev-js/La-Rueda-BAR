using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarBackend.Migrations
{
    /// <inheritdoc />
    public partial class AgregarOrdenMesas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PosicionX",
                table: "Mesas");

            migrationBuilder.DropColumn(
                name: "PosicionY",
                table: "Mesas");

            migrationBuilder.AddColumn<int>(
                name: "Orden",
                table: "Mesas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Orden",
                table: "Mesas");

            migrationBuilder.AddColumn<double>(
                name: "PosicionX",
                table: "Mesas",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "PosicionY",
                table: "Mesas",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
