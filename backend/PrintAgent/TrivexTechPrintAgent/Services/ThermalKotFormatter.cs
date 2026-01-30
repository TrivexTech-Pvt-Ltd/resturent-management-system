using System.Text;
using TrivexTechPrintAgent.Models;
using TrivexTechPrintAgent.Services;

public class ThermalKotFormatter : IInvoiceFormatter
{
    public string Format(InvoiceDto invoice)
    {
        var sb = new StringBuilder();

        sb.Append("\x1B\x40");       // Init
        sb.Append("\x1B\x61\x01");   // Center align

        // ===== TITLE =====
        sb.Append("\x1D\x21\x11");   // Double width + height
        sb.Append("\x1B\x45\x01");   // Bold ON
        sb.AppendLine("KITCHEN ORDER");
        sb.Append("\x1D\x21\x00");   // Normal size
        sb.Append("\x1B\x45\x00");   // Bold OFF

        sb.AppendLine();

        // ===== ORDER NUMBER (BIG & BOLD) =====
        sb.Append("\x1B\x45\x01");   // Bold ON
        sb.AppendLine("ORDER NO");
        sb.Append("\x1D\x21\x11");   // Double size
        sb.AppendLine(invoice.OrderNo); // or invoice.OrderNo
        sb.Append("\x1D\x21\x00");   // Normal size
        sb.Append("\x1B\x45\x00");   // Bold OFF


        // ===== META INFO =====
        sb.Append("\x1B\x45\x01");   // Bold ON
        sb.AppendLine($"Time    : {DateTime.Now:HH:mm}");
        sb.Append("\x1B\x45\x00");   // Bold OFF

        sb.AppendLine("--------------------------------");

        // ===== ITEMS =====
        sb.Append("\x1B\x45\x01");   // Bold ON

        foreach (var item in invoice.Items)
        {
            sb.AppendLine(item.Name.ToUpper());
            sb.AppendLine($"  QTY: {item.Qty}");
            sb.AppendLine();
        }

        sb.Append("\x1B\x45\x00");   // Bold OFF

        sb.AppendLine("--------------------------------");

        // ===== FOOTER =====
        sb.Append("\x1B\x45\x01");
        sb.AppendLine("*** KOT COPY ***");
        sb.Append("\x1B\x45\x00");

        sb.AppendLine("\n\n\n");
        sb.Append("\x1D\x56\x00");   // Cut

        return sb.ToString();
    }
}
