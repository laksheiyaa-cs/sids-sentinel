import { useState } from "react";
import { useScans, useAlerts } from "@/hooks/useScans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const { data: scans } = useScans();
  const { data: alerts } = useAlerts();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = scans?.filter((s) => {
    if (typeFilter !== "all" && s.scan_type !== typeFilter) return false;
    if (dateFrom && new Date(s.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(s.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const threats = filtered?.filter((s) => s.classification && !["safe", "legitimate"].includes(s.classification));

  const downloadJSON = () => {
    const report = {
      generated_at: new Date().toISOString(),
      total_scans: filtered?.length ?? 0,
      threats_detected: threats?.length ?? 0,
      scans: filtered,
      alerts: alerts,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sids-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("SIDS Threat Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, 14, 30);
    doc.text(`Total Scans: ${filtered?.length ?? 0}`, 14, 36);
    doc.text(`Threats Detected: ${threats?.length ?? 0}`, 14, 42);

    if (filtered?.length) {
      autoTable(doc, {
        startY: 50,
        head: [["Type", "Input", "Score", "Classification", "Date"]],
        body: filtered.slice(0, 50).map((s) => [
          s.scan_type,
          s.input.substring(0, 40),
          String(s.risk_score ?? "—"),
          s.classification ?? "—",
          format(new Date(s.created_at), "yyyy-MM-dd"),
        ]),
        styles: { fontSize: 8 },
      });
    }

    doc.save(`sids-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">Reports</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Generate and download threat reports</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div>
            <label className="font-mono text-[10px] text-muted-foreground block mb-1">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="font-mono text-xs bg-muted border border-border rounded px-2 py-1 text-foreground" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground block mb-1">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="font-mono text-xs bg-muted border border-border rounded px-2 py-1 text-foreground" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground block mb-1">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="font-mono text-xs bg-muted border border-border rounded px-2 py-1 text-foreground">
              <option value="all">All</option>
              <option value="url">URL</option>
              <option value="message">Message</option>
              <option value="profile">Profile</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-foreground">{filtered?.length ?? 0}</p>
              <p className="font-mono text-xs text-muted-foreground">Total Scans</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-destructive">{threats?.length ?? 0}</p>
              <p className="font-mono text-xs text-muted-foreground">Threats</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-primary">{alerts?.filter((a) => !a.reviewed).length ?? 0}</p>
              <p className="font-mono text-xs text-muted-foreground">Unreviewed</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={downloadPDF} className="font-mono text-xs uppercase tracking-wider">
              <Download className="h-4 w-4 mr-2" /> PDF Report
            </Button>
            <Button onClick={downloadJSON} variant="outline" className="font-mono text-xs uppercase tracking-wider">
              <FileText className="h-4 w-4 mr-2" /> JSON Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
