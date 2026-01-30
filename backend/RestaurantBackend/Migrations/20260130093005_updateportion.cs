using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantBackend.Migrations
{
    /// <inheritdoc />
    public partial class updateportion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MenuItemPortion_MenuItems_MenuItemId",
                table: "MenuItemPortion");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MenuItemPortion",
                table: "MenuItemPortion");

            migrationBuilder.RenameTable(
                name: "MenuItemPortion",
                newName: "MenuItemPortions");

            migrationBuilder.RenameIndex(
                name: "IX_MenuItemPortion_MenuItemId",
                table: "MenuItemPortions",
                newName: "IX_MenuItemPortions_MenuItemId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MenuItemPortions",
                table: "MenuItemPortions",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItemPortions_MenuItems_MenuItemId",
                table: "MenuItemPortions",
                column: "MenuItemId",
                principalTable: "MenuItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MenuItemPortions_MenuItems_MenuItemId",
                table: "MenuItemPortions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MenuItemPortions",
                table: "MenuItemPortions");

            migrationBuilder.RenameTable(
                name: "MenuItemPortions",
                newName: "MenuItemPortion");

            migrationBuilder.RenameIndex(
                name: "IX_MenuItemPortions_MenuItemId",
                table: "MenuItemPortion",
                newName: "IX_MenuItemPortion_MenuItemId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MenuItemPortion",
                table: "MenuItemPortion",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItemPortion_MenuItems_MenuItemId",
                table: "MenuItemPortion",
                column: "MenuItemId",
                principalTable: "MenuItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
