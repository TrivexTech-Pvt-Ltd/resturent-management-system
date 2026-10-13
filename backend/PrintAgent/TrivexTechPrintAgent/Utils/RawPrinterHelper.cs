using System.Runtime.InteropServices;
using System.Text;

namespace TrivexTechPrintAgent.Utils;

public class RawPrinterHelper
{
    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool StartDocPrinter(IntPtr hPrinter, int level, IntPtr pDocInfo);

    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static void SendStringToPrinter(string printerName, string text)
    {
        OpenPrinter(printerName, out var hPrinter, IntPtr.Zero);

        var bytes = Encoding.ASCII.GetBytes(text);
        var pBytes = Marshal.AllocHGlobal(bytes.Length);
        Marshal.Copy(bytes, 0, pBytes, bytes.Length);

        var docInfo = new DOCINFOA { pDocName = "Invoice", pDataType = "RAW" };
        var pDocInfo = Marshal.AllocHGlobal(Marshal.SizeOf(docInfo));
        Marshal.StructureToPtr(docInfo, pDocInfo, false);

        StartDocPrinter(hPrinter, 1, pDocInfo);
        StartPagePrinter(hPrinter);
        WritePrinter(hPrinter, pBytes, bytes.Length, out _);
        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);

        Marshal.FreeHGlobal(pBytes);
        Marshal.FreeHGlobal(pDocInfo);
        ClosePrinter(hPrinter);
    }

    struct DOCINFOA
    {
        public string pDocName;
        public string pOutputFile;
        public string pDataType;
    }
}
