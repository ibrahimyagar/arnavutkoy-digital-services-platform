using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArnavutkoyBelediyesi.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCitizenProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CitizenProperties",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    NeighborhoodId = table.Column<Guid>(type: "uuid", nullable: false),
                    StreetId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DoorNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BlockParcel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CitizenProperties", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CitizenProperties_NeighborhoodId",
                table: "CitizenProperties",
                column: "NeighborhoodId");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenProperties_OwnerUserId",
                table: "CitizenProperties",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenProperties_StreetId",
                table: "CitizenProperties",
                column: "StreetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CitizenProperties");
        }
    }
}
