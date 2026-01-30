using System.Drawing.Printing;
using TrivexTechPrintAgent.Enums;

namespace TrivexTechPrintAgent.Services;

public class PrinterService
{
    private readonly IConfiguration _config;

    public PrinterService(IConfiguration config)
    {
        _config = config;
    }

    public string GetPrinterName()
    {
        var name = _config["Printer:Name"];
        return string.IsNullOrWhiteSpace(name)
            ? new PrinterSettings().PrinterName
            : name;
    }

    public PrinterType GetPrinterType()
    {
        var type = _config["Printer:Type"];
        return Enum.TryParse<PrinterType>(type, true, out var result)
            ? result
            : PrinterType.DotMatrix;
    }

    public bool PrinterExists(string printerName)
    {
        return PrinterSettings.InstalledPrinters
            .Cast<string>()
            .Any(p => p.Equals(printerName, StringComparison.OrdinalIgnoreCase));
    }
}
