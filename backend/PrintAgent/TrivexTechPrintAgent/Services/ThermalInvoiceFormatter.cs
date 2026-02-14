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

    // COLUMN WIDTHS (MUST TOTAL = 38)
    private const int ITEM_COL_WIDTH = 12;
    private const int QTY_WIDTH = 7;
    private const int PRICE_WIDTH = 9;
    private const int AMOUNT_WIDTH = 10;

    public string Format(InvoiceDto invoice)
    {
        var sb = new StringBuilder();

        // ================= INIT =================
        sb.Append("\x1B\x40"); // Initialize printer

        // ================= ORDER NUMBER =================
        sb.Append("\x1B\x61\x01"); // Center
        sb.Append("\x1B\x45\x01"); // Bold ON
        sb.AppendLine("ORDER NO");

        sb.Append("\x1D\x21\x11"); // Double size
        sb.AppendLine(invoice.OrderNo);
        sb.Append("\x1D\x21\x00"); // Normal size

        sb.Append("\x1B\x45\x00"); // Bold OFF
        sb.AppendLine();
        sb.Append("\x1B\x61\x00"); // Left

        // ================= TOP MARGIN =================
        for (int i = 0; i < TOP_MARGIN_LINES; i++)
            sb.AppendLine();

        // ================= STORE NAME =================
        sb.Append("\x1B\x61\x01"); // Center
        sb.Append("\x1D\x21\x11"); // Double size
        sb.Append("\x1B\x45\x01"); // Bold ON
        sb.AppendLine("LOTTERIA");
        sb.Append("\x1D\x21\x00");
        sb.Append("\x1B\x45\x00");
        sb.AppendLine("CHINESE RESTAURANT");
        sb.Append("\x1B\x61\x00");

        sb.AppendLine();

        // ================= ADDRESS =================
        sb.Append("\x1B\x61\x01"); // Center alignment

        sb.AppendLine("No 434, Athurugiriya Road");
        sb.AppendLine("Hokandara North");
        sb.AppendLine("Tel: 0117987100 / 0719440100");

        sb.Append("\x1B\x61\x00"); // Back to left alignment
        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        // ================= INVOICE INFO =================
        sb.AppendLine(LEFT_PADDING + $"Order No : {invoice.OrderNo}");
        sb.AppendLine(LEFT_PADDING + $"Date     : {DateTime.Now:yyyy-MM-dd HH:mm}");

        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        // ================= TABLE HEADER =================
        sb.Append("\x1B\x45\x01"); // Bold ON
        sb.AppendLine(
            LEFT_PADDING +
            "Item".PadRight(ITEM_COL_WIDTH) +
            "Qty".PadLeft(QTY_WIDTH) +
            "Rate".PadLeft(PRICE_WIDTH) +
            "Amt".PadLeft(AMOUNT_WIDTH)
        );
        sb.Append("\x1B\x45\x00"); // Bold OFF

        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        // ================= ITEMS =================
        foreach (var item in invoice.Items)
        {
            var wrappedLines = WrapText(item.Name, ITEM_COL_WIDTH).ToList();

            string qty = item.Qty.ToString();
            string price = item.Price.ToString("0.00");
            string amount = (item.Qty * item.Price).ToString("0.00");

            for (int i = 0; i < wrappedLines.Count; i++)
            {
                if (i == wrappedLines.Count - 1)
                {
                    sb.AppendLine(
                        LEFT_PADDING +
                        wrappedLines[i].PadRight(ITEM_COL_WIDTH) +
                        qty.PadLeft(QTY_WIDTH) +
                        price.PadLeft(PRICE_WIDTH) +
                        amount.PadLeft(AMOUNT_WIDTH)
                    );
                }
                else
                {
                    sb.AppendLine(
                        LEFT_PADDING +
                        wrappedLines[i].PadRight(ITEM_COL_WIDTH)
                    );
                }
            }

            sb.AppendLine();
        }

        sb.AppendLine(LEFT_PADDING + "--------------------------------------");

        // ================= TOTALS =================
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

        // ================= FOOTER =================
        sb.AppendLine();
        sb.Append("\x1B\x61\x01"); // Center
        sb.AppendLine("Thank You! Come Again");
        sb.AppendLine("SYSTEM BY TrivexTech Pvt Ltd");
        sb.AppendLine("www.trivextech.lk");
        sb.AppendLine("+94 777 152 490");
        sb.Append("\x1B\x61\x00"); // Left

        // ================= BOTTOM MARGIN =================
        for (int i = 0; i < BOTTOM_MARGIN_LINES; i++)
            sb.AppendLine();

        // ================= CUT =================
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
