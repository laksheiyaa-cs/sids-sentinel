import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserSearch, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  bio: z.string().max(1000).optional(),
  description: z.string().min(5, "Description must be at least 5 characters").max(2000),
});

interface ScanResult {
  risk_score: number;
  classification: string;
  findings: string[];
  details: string;
}

export default function ScanProfile() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ name, bio, description });
    if (!parsed.success) {
      toast({ title: "Validation error", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("scan-profile", {
        body: { name, bio, description },
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
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">Profile Detector</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Detect fake profiles & synthetic identities</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardContent className="p-6">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="font-mono border-primary/20 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
              <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Optional bio text" className="font-mono border-primary/20 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Profile Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full profile description..." className="min-h-[100px] font-mono border-primary/20 bg-muted/50" />
            </div>
            <Button type="submit" disabled={loading} className="font-mono uppercase tracking-wider">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className={`border ${
          result.classification === "legitimate" ? "border-primary/30" :
          result.classification === "suspicious" ? "border-yellow-500/30" : "border-destructive/30"
        } bg-card/80`}>
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-2">
              {result.classification === "legitimate" ? <Shield className="h-5 w-5 text-primary" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
              Analysis Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Risk Score</p>
                <p className={`font-mono text-4xl font-bold ${result.risk_score < 30 ? "text-primary" : result.risk_score < 70 ? "text-yellow-500" : "text-destructive"}`}>{result.risk_score}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">Classification</p>
                <p className="font-mono text-lg font-bold uppercase text-foreground">{result.classification}</p>
              </div>
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground mb-2">Analysis</p>
              <p className="font-mono text-sm text-foreground/80">{result.details}</p>
            </div>
            {result.findings?.length > 0 && (
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-2">Findings</p>
                <ul className="space-y-1">
                  {result.findings.map((f, i) => (
                    <li key={i} className="font-mono text-sm text-foreground/70 flex items-start gap-2">
                      <span className="text-primary mt-1">▸</span> {f}
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
