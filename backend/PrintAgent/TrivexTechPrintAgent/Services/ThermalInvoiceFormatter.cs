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

    private static readonly string LINE = new string('-', CONTENT_WIDTH);
    private static readonly string DLINE = new string('=', CONTENT_WIDTH);

    // Set to false if your printer does not support CODE128 barcodes
    private const bool PRINT_BARCODE = true;

    public string Format(InvoiceDto invoice)
    {
        var sb = new StringBuilder();

        // ================= INIT =================
        sb.Append("\x1B\x40"); // Initialize printer
        sb.Append("\x1B\x33\x00"); // Set line spacing to 0
        // ================= LOGO =================
        sb.Append("\x1B\x61\x01");            // Center
        sb.Append(LogoData.GetEscPosString());  // Logo image
        sb.AppendLine();

        // ================= STORE NAME =================
        sb.Append("\x1D\x21\x11"); // Double size
        sb.Append("\x1B\x45\x01"); // Bold ON
        sb.AppendLine("LOTTERIA");
        sb.Append("\x1D\x21\x00");
        sb.AppendLine("CHINESE RESTAURANT");
        sb.Append("\x1B\x45\x00");
        sb.AppendLine("* * * * * * * * * *");
        sb.AppendLine();

        // ================= ADDRESS =================
        sb.AppendLine("No 434, Athurugiriya Road");
        sb.AppendLine("Hokandara North");
        sb.AppendLine("Tel: 0117987100 / 0719440100");
        sb.Append("\x1B\x61\x00"); // Left

        sb.AppendLine(LEFT_PADDING + DLINE);

        // ================= ORDER NUMBER =================
        sb.Append("\x1B\x61\x01");
        sb.Append("\x1B\x45\x01");
        sb.AppendLine("ORDER NO");
        sb.Append("\x1D\x21\x11");
        sb.AppendLine(invoice.OrderNo);
        sb.Append("\x1D\x21\x00");
        sb.Append("\x1B\x45\x00");
        sb.Append("\x1B\x61\x00");

        sb.AppendLine(LEFT_PADDING + DLINE);

        // ================= INVOICE INFO =================
        sb.AppendLine(LEFT_PADDING + $"Order No : {invoice.OrderNo}");
        sb.AppendLine(LEFT_PADDING + $"Date     : {DateTime.Now:yyyy-MM-dd HH:mm}");

        sb.AppendLine(LEFT_PADDING + LINE);

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

        sb.AppendLine(LEFT_PADDING + LINE);

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
                    sb.AppendLine(LEFT_PADDING + wrappedLines[i].PadRight(ITEM_COL_WIDTH));
                }
            }

            sb.AppendLine();
        }

        sb.AppendLine(LEFT_PADDING + LINE);

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

        sb.AppendLine(LEFT_PADDING + DLINE);

        sb.Append("\x1B\x45\x01");  // Bold ON
        sb.Append("\x1D\x21\x01");  // Double height
        sb.AppendLine(
            LEFT_PADDING +
            "GRAND TOTAL".PadRight(28) +
            invoice.Total.ToString("0.00").PadLeft(10)
        );
        sb.Append("\x1D\x21\x00");
        sb.Append("\x1B\x45\x00");

        sb.AppendLine(LEFT_PADDING + DLINE);

        // ================= FOOTER =================
        sb.AppendLine();
        sb.Append("\x1B\x61\x01"); // Center
        sb.Append("\x1B\x45\x01");
        sb.AppendLine("Thank You! Come Again");
        sb.Append("\x1B\x45\x00");
        sb.AppendLine();

        // ================= BARCODE (Order No) =================
        if (PRINT_BARCODE && !string.IsNullOrWhiteSpace(invoice.OrderNo))
        {
            sb.Append("\x1D\x68\x40");  // Height 64
            sb.Append("\x1D\x77\x02");  // Width 2
            sb.Append("\x1D\x48\x02");  // Number printed below barcode
            sb.Append("\x1D\x6B\x49");  // CODE128
            sb.Append((char)(invoice.OrderNo.Length + 2));
            sb.Append("{B" + invoice.OrderNo);
            sb.AppendLine();
        }

        sb.AppendLine();
        sb.AppendLine(". . . . . . . . . . . . . . . .");
        sb.AppendLine("SYSTEM BY TrivexTech Pvt Ltd");
        sb.AppendLine("www.trivextech.lk");
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
