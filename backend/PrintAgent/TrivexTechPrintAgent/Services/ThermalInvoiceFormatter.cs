using System.Text;
using TrivexTechPrintAgent.Models;

namespace TrivexTechPrintAgent.Services;

public class ThermalInvoiceFormatter : IInvoiceFormatter
{
    private const int PRINTER_WIDTH = 44;
    private const int CONTENT_WIDTH = 38;
    private static readonly string LEFT_PADDING =
        new string(' ', (PRINTER_WIDTH - CONTENT_WIDTH) / 2);

    private const int TOP_MARGIN_LINES = 1;
    private const int BOTTOM_MARGIN_LINES = 6;

    public string Format(InvoiceDto invoice)
    {
        var sb = new StringBuilder();

        // ================================
        // INIT
        // ================================
        sb.Append("\x1B\x40"); // Init printer

        // ================================
        // BIG ORDER NUMBER (CENTERED)
        // ================================
        sb.Append("\x1B\x61\x01"); // Center align
        sb.Append("\x1B\x45\x01"); // Bold ON
        sb.AppendLine("ORDER NO");

        sb.Append("\x1D\x21\x11"); // Double width + height
        sb.AppendLine(invoice.OrderNo); // You can replace with invoice.OrderNo
        sb.Append("\x1D\x21\x00"); // Back to normal

        sb.Append("\x1B\x45\x00"); // Bold OFF
        sb.AppendLine();

        // Back to LEFT alignment for normal receipt
        sb.Append("\x1B\x61\x00");

        // ================================
        // TOP MARGIN
        // ================================
        for (int i = 0; i < TOP_MARGIN_LINES; i++)
            sb.AppendLine();

        // ================================
        // ASCII LOGO
        // ================================
        sb.AppendLine(LEFT_PADDING + "+------------------------------------+");
        sb.AppendLine(LEFT_PADDING + "|           LOTTERIA CHINESE         |");
        sb.AppendLine(LEFT_PADDING + "|              RRSTAURANT            |");
        sb.AppendLine(LEFT_PADDING + "+------------------------------------+");

        sb.AppendLine(LEFT_PADDING + "       No 434, Athurugiriya  Road,");
        sb.AppendLine(LEFT_PADDING + "           Hokandara North");
        sb.AppendLine(LEFT_PADDING + "          Tel: 0112652046");

        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        // ================================
        // INVOICE INFO
        // ================================
        sb.AppendLine(LEFT_PADDING + $"Order No : {invoice.OrderNo}");
        sb.AppendLine(LEFT_PADDING + $"Date       : {DateTime.Now:yyyy-MM-dd HH:mm}");
        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        // ================================
        // TABLE HEADER
        // ================================
        sb.AppendLine(LEFT_PADDING + "Item              Qty   Rate     Amt");
        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        const int ITEM_COL_WIDTH = 12;
        const int QTY_WIDTH = 7;
        const int PRICE_WIDTH = 9;
        const int AMOUNT_WIDTH = 10;

        foreach (var item in invoice.Items)
        {
            // Show portion size next to item name
            string itemDisplayName = $"{item.Name} ({item.PortionSize})";

            foreach (var line in WrapText(itemDisplayName, CONTENT_WIDTH))
            {
                sb.AppendLine(LEFT_PADDING + line);
            }

            string qty = item.Qty.ToString();
            string price = item.Price.ToString("0.00");
            string amount = (item.Qty * item.Price).ToString("0.00");

            string numbers =
                qty.PadLeft(QTY_WIDTH) +
                price.PadLeft(PRICE_WIDTH) +
                amount.PadLeft(AMOUNT_WIDTH);

            sb.AppendLine(
                LEFT_PADDING +
                "".PadRight(ITEM_COL_WIDTH) +
                numbers
            );

            sb.AppendLine();
        }


        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        // ================================
        // TOTALS
        // ================================
        sb.AppendLine(
            LEFT_PADDING +
            "Sub Total".PadRight(28) +
            invoice.Total.ToString("0.00").PadLeft(10)
        );

        sb.AppendLine(
            LEFT_PADDING +
            "Discount".PadRight(28) +
            "0.00".PadLeft(10)
        );

        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        sb.Append("\x1B\x45\x01"); // Bold ON
        sb.AppendLine(
            LEFT_PADDING +
            "GRAND TOTAL".PadRight(28) +
            invoice.Total.ToString("0.00").PadLeft(10)
        );
        sb.Append("\x1B\x45\x00"); // Bold OFF

        // ================================
        // FOOTER
        // ================================
        sb.AppendLine();
        sb.AppendLine(LEFT_PADDING + "         Thank You! Come Again");
        sb.AppendLine(LEFT_PADDING + "       SYSTEM BY TrivexTech Pvt Ltd");
        sb.AppendLine(LEFT_PADDING + "           www.trivextech.lk");
        sb.AppendLine(LEFT_PADDING + "            +94 777 152 490");

        // ================================
        // BOTTOM MARGIN
        // ================================
        for (int i = 0; i < BOTTOM_MARGIN_LINES; i++)
            sb.AppendLine();

        // ================================
        // CUT
        // ================================
        sb.Append("\x1D\x56\x00"); // Full cut

        return sb.ToString();
    }

    private static IEnumerable<string> WrapText(string text, int maxWidth)
    {
        if (string.IsNullOrWhiteSpace(text))
            yield break;

        var words = text.Split(' ');
        var line = new StringBuilder();

        foreach (var word in words)
        {
            if (line.Length + word.Length + 1 > maxWidth)
            {
                yield return line.ToString();
                line.Clear();
            }

            if (line.Length > 0)
                line.Append(' ');

            line.Append(word);
        }

        if (line.Length > 0)
            yield return line.ToString();
    }
}
