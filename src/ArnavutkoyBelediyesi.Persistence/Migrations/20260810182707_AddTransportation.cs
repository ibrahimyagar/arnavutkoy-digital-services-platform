using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArnavutkoyBelediyesi.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTransportation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BoardingRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TransportCardId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    FareCharged = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BoardedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardingRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BusLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    RouteSummary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    BaseFare = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusLines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TransportCards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CardNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Balance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransportCards", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BoardingRecords_BusLineId",
                table: "BoardingRecords",
                column: "BusLineId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardingRecords_TransportCardId",
                table: "BoardingRecords",
                column: "TransportCardId");

            migrationBuilder.CreateIndex(
                name: "IX_BusLines_Code",
                table: "BusLines",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransportCards_CardNumber",
                table: "TransportCards",
                column: "CardNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransportCards_OwnerUserId",
                table: "TransportCards",
                column: "OwnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardingRecords");

            migrationBuilder.DropTable(
                name: "BusLines");

            migrationBuilder.DropTable(
                name: "TransportCards");
        }
    }
}
