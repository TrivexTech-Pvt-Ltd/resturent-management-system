namespace TrivexTechPrintAgent.Models;

public class InvoiceDto
{
    public string InvoiceNo { get; set; } = "";
    public List<InvoiceItemDto> Items { get; set; } = [];
    public decimal Total { get; set; }
    public string OrderNo { get; set; } = "";
}

public class InvoiceItemDto
{
    public string Name { get; set; } = "";
    public int Qty { get; set; }
    public decimal Price { get; set; }
}
