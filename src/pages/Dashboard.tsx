import { useScans, useAlerts } from "@/hooks/useScans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Activity, Target } from "lucide-react";
import { format } from "date-fns";

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <Card className="border-primary/10 bg-card/80">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${color} bg-opacity-10`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: scans, isLoading } = useScans();
  const { data: alerts } = useAlerts();

  const totalScans = scans?.length ?? 0;
  const threats = scans?.filter((s) => s.classification && !["safe", "legitimate"].includes(s.classification)).length ?? 0;
  const avgRisk = totalScans > 0
    ? Math.round((scans?.reduce((sum, s) => sum + (s.risk_score ?? 0), 0) ?? 0) / totalScans)
    : 0;
  const unreviewedAlerts = alerts?.filter((a) => !a.reviewed).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">Dashboard</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Real-time threat monitoring</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Scans" value={totalScans} icon={Activity} color="border-primary/30 text-primary" />
        <StatCard title="Threats Found" value={threats} icon={AlertTriangle} color="border-destructive/30 text-destructive" />
        <StatCard title="Avg Risk Score" value={avgRisk} icon={Target} color="border-secondary/30 text-secondary" />
        <StatCard title="Active Alerts" value={unreviewedAlerts} icon={Shield} color="border-accent/30 text-accent" />
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Recent Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="font-mono text-sm text-muted-foreground">Loading...</p>
          ) : !scans?.length ? (
            <p className="font-mono text-sm text-muted-foreground">No scans yet. Start scanning to see results here.</p>
          ) : (
            <div className="space-y-2">
              {scans.slice(0, 10).map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-block h-2 w-2 rounded-full ${
                      scan.classification === "safe" || scan.classification === "legitimate"
                        ? "bg-primary"
                        : scan.classification === "suspicious"
                        ? "bg-yellow-500"
                        : "bg-destructive"
                    }`} />
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground uppercase">{scan.scan_type}</p>
                      <p className="font-mono text-sm text-foreground truncate max-w-[300px]">{scan.input}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`font-mono text-sm font-bold ${
                      (scan.risk_score ?? 0) < 30 ? "text-primary" :
                      (scan.risk_score ?? 0) < 70 ? "text-yellow-500" : "text-destructive"
                    }`}>
                      {scan.risk_score ?? "—"}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {format(new Date(scan.created_at), "HH:mm:ss")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
