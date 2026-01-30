using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RestaurantBackend.Migrations
{
    /// <inheritdoc />
    public partial class mid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MenuItemPortions",
                keyColumn: "Id",
                keyValue: "CR-L");

            migrationBuilder.DeleteData(
                table: "MenuItemPortions",
                keyColumn: "Id",
                keyValue: "CR-M");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "1");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "2");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "3");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "4");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "5");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "6");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "CR");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "MenuItems",
                columns: new[] { "Id", "Category", "Image", "Name" },
                values: new object[,]
                {
                    { "1", "Burgers", null, "Classic Burger" },
                    { "2", "Burgers", null, "Cheese Burger" },
                    { "3", "Sides", null, "French Fries" },
                    { "4", "Drinks", null, "Coke" },
                    { "5", "Pizza", null, "Pizza Margherita" },
                    { "6", "Pasta", null, "Pasta Carbonara" },
                    { "CR", "Rice", null, "Chicken Rice" }
                });

            migrationBuilder.InsertData(
                table: "MenuItemPortions",
                columns: new[] { "Id", "IsAvailable", "MenuItemId", "Price", "Size" },
                values: new object[,]
                {
                    { "CR-L", true, "CR", 850m, "L" },
                    { "CR-M", true, "CR", 650m, "M" }
                });
        }
    }
}
