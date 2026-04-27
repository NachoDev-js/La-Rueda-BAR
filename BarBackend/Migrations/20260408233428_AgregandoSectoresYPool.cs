using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarBackend.Migrations
{
    /// <inheritdoc />
    public partial class AgregandoSectoresYPool : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsPool",
                table: "Mesas",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "HoraInicioPool",
                table: "Mesas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Sector",
                table: "Mesas",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EsPool",
                table: "Mesas");

            migrationBuilder.DropColumn(
                name: "HoraInicioPool",
                table: "Mesas");

            migrationBuilder.DropColumn(
                name: "Sector",
                table: "Mesas");
        }
    }
}
