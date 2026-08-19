using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArnavutkoyBelediyesi.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UniqueNormalizedEmailIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "EmailIndex",
                table: "AspNetUsers");

            migrationBuilder.Sql(
                """
                UPDATE "AspNetUsers"
                SET
                    "Email" = lower(replace(replace(btrim("Email"), U&'\0130', 'i'), U&'\0131', 'i') COLLATE "C"),
                    "UserName" = CASE
                        WHEN "UserName" IS NOT NULL
                             AND lower(replace(replace(btrim("UserName"), U&'\0130', 'i'), U&'\0131', 'i') COLLATE "C")
                               = lower(replace(replace(btrim("Email"), U&'\0130', 'i'), U&'\0131', 'i') COLLATE "C")
                        THEN lower(replace(replace(btrim("Email"), U&'\0130', 'i'), U&'\0131', 'i') COLLATE "C")
                        ELSE "UserName"
                    END
                WHERE "Email" IS NOT NULL;

                UPDATE "AspNetUsers"
                SET
                    "NormalizedEmail" = upper("Email" COLLATE "C"),
                    "NormalizedUserName" = upper("UserName" COLLATE "C")
                WHERE "Email" IS NOT NULL OR "UserName" IS NOT NULL;

                DELETE FROM "AspNetUsers" a
                USING "AspNetUsers" b
                WHERE a."Id" > b."Id"
                  AND a."NormalizedEmail" IS NOT NULL
                  AND a."NormalizedEmail" = b."NormalizedEmail";
                """);

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail",
                unique: true,
                filter: "\"NormalizedEmail\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "EmailIndex",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");
        }
    }
}
