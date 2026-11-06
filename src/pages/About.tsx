import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Cpu, Database, Globe, Zap, Lock } from "lucide-react";

export default function About() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">About SIDS</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Smart Identity Deception System</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Mission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-sm text-foreground/80 leading-relaxed">
            SIDS is an AI-powered cybersecurity platform that detects phishing URLs, scam messages,
            synthetic identities, and social engineering attempts in real-time. Our mission is to
            protect individuals and organizations from increasingly sophisticated digital deception.
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-secondary" /> Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { icon: Globe, label: "Frontend", desc: "React + Tailwind CSS with real-time updates" },
              { icon: Zap, label: "AI Engine", desc: "Google Gemini-powered threat analysis" },
              { icon: Database, label: "Database", desc: "PostgreSQL with row-level security" },
              { icon: Lock, label: "Auth", desc: "Email-based authentication with protected routes" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">{label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["React", "TypeScript", "Tailwind CSS", "PostgreSQL", "Edge Functions", "Google Gemini AI", "Real-time Subscriptions", "Row-Level Security"].map((tech) => (
              <span key={tech} className="font-mono text-xs px-2 py-1 rounded border border-primary/20 bg-primary/5 text-primary">
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
