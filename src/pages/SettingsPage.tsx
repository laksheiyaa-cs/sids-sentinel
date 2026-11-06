import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";

const sensitivityMap: Record<string, number> = { low: 0, medium: 50, high: 100 };
const sensitivityReverse: Record<number, string> = { 0: "low", 50: "medium", 100: "high" };

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  if (isLoading || !settings) {
    return <p className="font-mono text-sm text-muted-foreground">Loading settings...</p>;
  }

  const toggle = (key: string, value: boolean) => updateSettings.mutate({ [key]: value });
  const setSensitivity = (val: number[]) => {
    const closest = Object.entries(sensitivityMap).reduce((prev, [, v]) =>
      Math.abs(v - val[0]) < Math.abs(prev - val[0]) ? v : prev, 50);
    updateSettings.mutate({ sensitivity: sensitivityReverse[closest] });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary neon-text">Settings</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Configure detection modules</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Detection Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "url_scanning_enabled", label: "URL Scanning" },
            { key: "message_scanning_enabled", label: "Message Scanning" },
            { key: "profile_scanning_enabled", label: "Profile Scanning" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="font-mono text-sm">{label}</Label>
              <Switch
                checked={(settings as any)[key]}
                onCheckedChange={(v) => toggle(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Sensitivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between font-mono text-xs text-muted-foreground">
            <span>Low</span><span>Medium</span><span>High</span>
          </div>
          <Slider
            value={[sensitivityMap[settings.sensitivity] ?? 50]}
            onValueChange={setSensitivity}
            max={100}
            step={50}
          />
          <p className="font-mono text-xs text-muted-foreground text-center capitalize">
            Current: {settings.sensitivity}
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-mono text-sm">Notifications</Label>
            <Switch checked={settings.notifications_enabled} onCheckedChange={(v) => toggle("notifications_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-sm">Dark Mode</Label>
            <Switch checked={settings.dark_mode} onCheckedChange={(v) => toggle("dark_mode", v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
