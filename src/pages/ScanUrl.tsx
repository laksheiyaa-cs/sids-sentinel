import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { z } from "zod";

const urlSchema = z.string().url("Please enter a valid URL").max(2000);

interface ScanResult {
  risk_score: number;
  classification: string;
  reasons: string[];
  details: string;
}

export default function ScanUrl() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      toast({ title: "Invalid URL", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("scan-url", {
        body: { url },
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">URL Scanner</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Analyze URLs for phishing indicators</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardContent className="p-6">
          <form onSubmit={handleScan} className="flex gap-3">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="pl-10 font-mono border-primary/20 bg-muted/50"
              />
            </div>
            <Button type="submit" disabled={loading} className="font-mono uppercase tracking-wider">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className={`border ${
          result.classification === "safe" ? "border-primary/30" :
          result.classification === "suspicious" ? "border-yellow-500/30" : "border-destructive/30"
        } bg-card/80`}>
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-2">
              {result.classification === "safe" ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              Analysis Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Risk Score</p>
                <p className={`font-mono text-4xl font-bold ${
                  result.risk_score < 30 ? "text-primary" :
                  result.risk_score < 70 ? "text-yellow-500" : "text-destructive"
                }`}>{result.risk_score}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">Classification</p>
                <p className={`font-mono text-lg font-bold uppercase ${
                  result.classification === "safe" ? "text-primary" :
                  result.classification === "suspicious" ? "text-yellow-500" : "text-destructive"
                }`}>{result.classification}</p>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-muted-foreground mb-2">Analysis Details</p>
              <p className="font-mono text-sm text-foreground/80">{result.details}</p>
            </div>

            {result.reasons?.length > 0 && (
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-2">Key Findings</p>
                <ul className="space-y-1">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="font-mono text-sm text-foreground/70 flex items-start gap-2">
                      <span className="text-primary mt-1">▸</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
