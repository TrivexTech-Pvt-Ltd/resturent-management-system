using TrivexTechPrintAgent.Models;

namespace TrivexTechPrintAgent.Services;

public interface IInvoiceFormatter
{
    string Format(InvoiceDto invoice);
}
