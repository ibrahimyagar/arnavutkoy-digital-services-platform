using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArnavutkoyBelediyesi.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddContactMessageTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreferredReply",
                table: "ContactMessages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Email");

            migrationBuilder.AddColumn<string>(
                name: "TrackingCode",
                table: "ContactMessages",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "ContactMessages"
                SET "TrackingCode" = 'ILET-LEGACY-' || UPPER(SUBSTRING(REPLACE("Id"::text, '-', ''), 1, 8))
                WHERE "TrackingCode" IS NULL OR "TrackingCode" = '';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "TrackingCode",
                table: "ContactMessages",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_CitizenUserId",
                table: "ContactMessages",
                column: "CitizenUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_TrackingCode",
                table: "ContactMessages",
                column: "TrackingCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContactMessages_CitizenUserId",
                table: "ContactMessages");

            migrationBuilder.DropIndex(
                name: "IX_ContactMessages_TrackingCode",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "PreferredReply",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "TrackingCode",
                table: "ContactMessages");
        }
    }
}
