using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArnavutkoyBelediyesi.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserNationalIdAndEmailLogin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NationalId",
                table: "AspNetUsers",
                type: "character varying(11)",
                maxLength: 11,
                nullable: true);

            // Eski kurulumda UserName = TCKN idi; profil alanına taşı.
            migrationBuilder.Sql(
                """
                UPDATE "AspNetUsers"
                SET "NationalId" = "UserName"
                WHERE "NationalId" IS NULL
                  AND "UserName" IS NOT NULL
                  AND length("UserName") = 11
                  AND "UserName" ~ '^[0-9]+$';
                """);

            migrationBuilder.Sql(
                """
                UPDATE "AspNetUsers"
                SET "NationalId" = lpad(("Id"::text), 11, '0')
                WHERE "NationalId" IS NULL OR "NationalId" = '';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "NationalId",
                table: "AspNetUsers",
                type: "character varying(11)",
                maxLength: 11,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_NationalId",
                table: "AspNetUsers",
                column: "NationalId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_NationalId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "NationalId",
                table: "AspNetUsers");
        }
    }
}
