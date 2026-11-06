import { useState } from "react";
import { useAlerts } from "@/hooks/useScans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markReviewed = async (id: string) => {
    const { error } = await supabase.from("alerts").update({ reviewed: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  };

  const filtered = alerts?.filter((a) => {
    if (typeFilter !== "all" && a.alert_type !== typeFilter) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">Alerts</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Real-time threat notifications</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="font-mono text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
          >
            <option value="all">All Types</option>
            <option value="url">URL</option>
            <option value="message">Message</option>
            <option value="profile">Profile</option>
          </select>
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="font-mono text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="font-mono text-sm text-muted-foreground">Loading alerts...</p>
        ) : !filtered?.length ? (
          <Card className="border-primary/10 bg-card/80">
            <CardContent className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-mono text-sm text-muted-foreground">No alerts match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.severity === "critical" ? "border-l-destructive" :
              alert.severity === "high" ? "border-l-orange-500" :
              alert.severity === "medium" ? "border-l-yellow-500" : "border-l-primary"
            } ${alert.reviewed ? "opacity-60" : ""} bg-card/80`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 bg-muted rounded">{alert.alert_type}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      alert.severity === "critical" ? "bg-destructive/20 text-destructive" :
                      alert.severity === "high" ? "bg-orange-500/20 text-orange-400" :
                      alert.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-primary/20 text-primary"
                    }`}>{alert.severity}</span>
                    {alert.reviewed && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  <p className="font-mono text-sm font-medium text-foreground">{alert.title}</p>
                  {alert.description && <p className="font-mono text-xs text-muted-foreground mt-1 truncate max-w-lg">{alert.description}</p>}
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">
                    {format(new Date(alert.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </p>
                </div>
                {!alert.reviewed && (
                  <Button variant="ghost" size="sm" onClick={() => markReviewed(alert.id)} className="font-mono text-xs shrink-0">
                    <Check className="h-3 w-3 mr-1" /> Mark Reviewed
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
