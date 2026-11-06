import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { z } from "zod";

const messageSchema = z.string().min(10, "Message must be at least 10 characters").max(5000);

interface ScanResult {
  risk_score: number;
  classification: string;
  patterns: string[];
  details: string;
  confidence: number;
}

export default function ScanMessage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = messageSchema.safeParse(message);
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("scan-message", {
        body: { message },
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
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">Message Scanner</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Detect scam & phishing in SMS/email content</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardContent className="p-6">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste SMS or email content here..."
                className="min-h-[150px] pl-10 font-mono border-primary/20 bg-muted/50"
                maxLength={5000}
              />
            </div>
            <Button type="submit" disabled={loading} className="font-mono uppercase tracking-wider">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze Message"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className={`border ${
          result.classification === "safe" || result.classification === "legitimate" ? "border-primary/30" :
          result.classification === "suspicious" ? "border-yellow-500/30" : "border-destructive/30"
        } bg-card/80`}>
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-2">
              {result.classification === "safe" || result.classification === "legitimate" ? (
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
                <p className="font-mono text-lg font-bold uppercase text-foreground">{result.classification}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">Confidence</p>
                <p className="font-mono text-lg font-bold text-secondary">{result.confidence}%</p>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-muted-foreground mb-2">Analysis</p>
              <p className="font-mono text-sm text-foreground/80">{result.details}</p>
            </div>

            {result.patterns?.length > 0 && (
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-2">Detected Patterns</p>
                <ul className="space-y-1">
                  {result.patterns.map((p, i) => (
                    <li key={i} className="font-mono text-sm text-foreground/70 flex items-start gap-2">
                      <span className="text-primary mt-1">▸</span> {p}
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
