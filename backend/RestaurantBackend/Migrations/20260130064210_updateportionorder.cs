using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RestaurantBackend.Migrations
{
    /// <inheritdoc />
    public partial class updateportionorder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PortionSize",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "MenuItems");

            migrationBuilder.CreateTable(
                name: "MenuItemPortion",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    MenuItemId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Size = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemPortion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItemPortion_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MenuItems",
                columns: new[] { "Id", "Category", "Image", "Name" },
                values: new object[] { "CR", "Rice", null, "Chicken Rice" });

            migrationBuilder.InsertData(
                table: "MenuItemPortion",
                columns: new[] { "Id", "IsAvailable", "MenuItemId", "Price", "Size" },
                values: new object[,]
                {
                    { "CR-L", true, "CR", 850m, "L" },
                    { "CR-M", true, "CR", 650m, "M" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemPortion_MenuItemId",
                table: "MenuItemPortion",
                column: "MenuItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MenuItemPortion");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "CR");

            migrationBuilder.AddColumn<string>(
                name: "PortionSize",
                table: "MenuItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "MenuItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "1",
                columns: new[] { "PortionSize", "Price" },
                values: new object[] { null, 8.99m });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "2",
                columns: new[] { "PortionSize", "Price" },
                values: new object[] { null, 9.99m });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "3",
                columns: new[] { "PortionSize", "Price" },
                values: new object[] { null, 3.99m });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "4",
                columns: new[] { "PortionSize", "Price" },
                values: new object[] { null, 1.99m });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "5",
                columns: new[] { "PortionSize", "Price" },
                values: new object[] { null, 12.99m });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "6",
                columns: new[] { "PortionSize", "Price" },
                values: new object[] { null, 11.99m });
        }
    }
}
