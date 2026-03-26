"use client";

import { useEffect, useState } from "react";
import { api, Settings } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const PROVIDERS = [
  { value: "openai",    label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google",    label: "Google Gemini" },
  { value: "ollama",    label: "Ollama (local)" },
];

const DEFAULT_MODELS: Record<string, string> = {
  openai:    "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  google:    "gemini-2.0-flash",
  ollama:    "llama3.2",
};

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<Settings> & { api_key?: string }>({
    provider: "openai",
    model: "gpt-4o-mini",
    context_window_tokens: 128000,
    max_chunk_tokens: 24000,
    timeouts: { chunk_call_seconds: 60, synthesis_seconds: 120 },
    temperatures: { scanning: 0.1, synthesis: 0.2 },
    ollama_base_url: "http://host.docker.internal:11434",
  });
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.settings.get().then((s) => {
      setForm(s);
      setApiKeySet(s.api_key_set);
    }).catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const patch: Record<string, unknown> = { ...form };
      if (apiKey.trim()) patch.api_key = apiKey.trim();
      await api.settings.patch(patch);
      setSaved(true);
      if (apiKey) { setApiKeySet(true); setApiKey(""); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-6">Settings</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="flex flex-col gap-5">
        {/* Provider */}
        <Select
          label="Provider"
          value={form.provider ?? "openai"}
          onChange={(e) => {
            const p = e.target.value;
            set("provider", p);
            set("model", DEFAULT_MODELS[p] ?? "");
          }}
          options={PROVIDERS}
        />

        {/* Ollama base URL — only visible when Ollama is selected */}
        {form.provider === "ollama" && (
          <Input
            label="Ollama base URL"
            value={form.ollama_base_url ?? "http://host.docker.internal:11434"}
            onChange={(e) => set("ollama_base_url", e.target.value)}
            hint="Use host.docker.internal:11434 when Ollama runs on your Windows host"
          />
        )}

        {/* API key */}
        <Input
          label={`API key ${apiKeySet ? "(already set — enter to replace)" : ""}`}
          type="password"
          placeholder={apiKeySet ? "••••••••••••••••" : "sk-..."}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          hint={form.provider === "ollama" ? "Not required for Ollama" : undefined}
        />

        {/* Model */}
        <Input
          label="Model name"
          value={form.model ?? ""}
          onChange={(e) => set("model", e.target.value)}
          placeholder={DEFAULT_MODELS[form.provider ?? "openai"]}
        />

        {/* Token limits */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Context window (tokens)"
            type="number"
            value={form.context_window_tokens ?? 128000}
            onChange={(e) => set("context_window_tokens", Number(e.target.value))}
          />
          <Input
            label="Max chunk tokens"
            type="number"
            value={form.max_chunk_tokens ?? 24000}
            onChange={(e) => set("max_chunk_tokens", Number(e.target.value))}
          />
        </div>

        {/* Timeouts */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Chunk timeout (s)"
            type="number"
            value={form.timeouts?.chunk_call_seconds ?? 60}
            onChange={(e) => set("timeouts", { ...form.timeouts!, chunk_call_seconds: Number(e.target.value) })}
            hint="5 – 3600 s. Increase for slow local models."
          />
          <Input
            label="Synthesis timeout (s)"
            type="number"
            value={form.timeouts?.synthesis_seconds ?? 120}
            onChange={(e) => set("timeouts", { ...form.timeouts!, synthesis_seconds: Number(e.target.value) })}
            hint="5 – 3600 s. Increase for slow local models."
          />
        </div>

        {/* Temperatures */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Scanning temperature"
            type="number"
            step="0.05"
            min="0" max="1"
            value={form.temperatures?.scanning ?? 0.1}
            onChange={(e) => set("temperatures", { ...form.temperatures!, scanning: Number(e.target.value) })}
            hint="Recommended: 0.1"
          />
          <Input
            label="Synthesis temperature"
            type="number"
            step="0.05"
            min="0" max="1"
            value={form.temperatures?.synthesis ?? 0.2}
            onChange={(e) => set("temperatures", { ...form.temperatures!, synthesis: Number(e.target.value) })}
            hint="Recommended: 0.2"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved && <span className="text-xs text-emerald-400">Settings saved</span>}
          <Button onClick={handleSave} loading={saving} className="ml-auto">
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
