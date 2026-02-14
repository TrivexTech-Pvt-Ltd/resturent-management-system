using System.Drawing.Printing;
using TrivexTechPrintAgent.Models;
using TrivexTechPrintAgent.Services;
using TrivexTechPrintAgent.Utils;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// 1 Add CORS

//Register services
builder.Services.AddSingleton<PrinterService>();
builder.Services.AddSingleton<ThermalInvoiceFormatter>();
builder.Services.AddScoped<ThermalKotFormatter>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

var apiKey = builder.Configuration["Security:ApiKey"]!;

bool IsAuthorized(HttpRequest req) =>
    req.Headers.TryGetValue("X-API-KEY", out var key) && key == apiKey;

// 2️ Use CORS (VERY IMPORTANT – before MapXXX)
app.UseCors("AllowAll");

// Endpoints
app.MapGet("/printers", () =>
{
    return PrinterSettings.InstalledPrinters?.Cast<string>();
});

app.MapPost("/print", (
    HttpRequest request,
    InvoiceDto invoice,
    PrinterService printerService,
    ThermalInvoiceFormatter thermalFormatter, 
    ThermalKotFormatter kotFormatter

) =>
{
    if (!IsAuthorized(request))
        return Results.Unauthorized();

    var printerName = printerService.GetPrinterName();
    if (!printerService.PrinterExists(printerName))
        return Results.BadRequest($"Printer '{printerName}' not found");

    // Print Customer Bill
    var billText = thermalFormatter.Format(invoice);
    RawPrinterHelper.SendStringToPrinter(printerName, billText);

    // Print KOT
    var kotText = kotFormatter.Format(invoice);
    RawPrinterHelper.SendStringToPrinter(printerName, kotText);

    var referenceBil = thermalFormatter.Format(invoice);
    RawPrinterHelper.SendStringToPrinter(printerName, referenceBil);

    return Results.Ok("Bill and KOT printed successfully");
});

app.MapPost("/print-dienein", (
    HttpRequest request,
    InvoiceDto invoice,
    PrinterService printerService,
    ThermalInvoiceFormatter thermalFormatter
) =>
{
    if (!IsAuthorized(request))
        return Results.Unauthorized();

    var printerName = printerService.GetPrinterName();
    if (!printerService.PrinterExists(printerName))
        return Results.BadRequest($"Printer '{printerName}' not found");

    // Print Customer Bill
    var billText = thermalFormatter.Format(invoice);
    RawPrinterHelper.SendStringToPrinter(printerName, billText);

    var referenceBil = thermalFormatter.Format(invoice);
    RawPrinterHelper.SendStringToPrinter(printerName, referenceBil);

    return Results.Ok("Dienen Bill and printed successfully");
});

app.MapGet("/health", () => Results.Ok("Print Agent Running"));

app.MapPost("/print-preview", (
    InvoiceDto invoice,
    PrinterService printerService,
    ThermalInvoiceFormatter thermalFormatter
) =>
{
    var text = thermalFormatter.Format(invoice);
    return Results.Text(text, "text/plain");
});


app.UseHttpsRedirection();

app.Run();