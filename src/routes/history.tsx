import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Eye, FileText, LogOut, Stamp as StampIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { HistoryEntry } from "./app";

const HISTORY_KEY = "signstamp.history.v1";

export const Route = createFileRoute("/history")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "History — SignStamp" },
      { name: "description", content: "View and download your previously signed documents." },
    ],
  }),
});

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function HistoryPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  function persist(next: HistoryEntry[]) {
    setEntries(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  function remove(id: string) {
    if (!window.confirm("Delete this signed document from history?")) return;
    persist(entries.filter((e) => e.id !== id));
    if (previewId === id) setPreviewId(null);
    toast.success("Removed from history");
  }

  function clearAll() {
    if (!entries.length) return;
    if (!window.confirm(`Clear all ${entries.length} entries from history?`)) return;
    persist([]);
    setPreviewId(null);
    toast.success("History cleared");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const preview = entries.find((e) => e.id === previewId);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
              <StampIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">SignStamp</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <Link to="/app">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Editor
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] p-4">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Signing history</h1>
            <p className="text-sm text-muted-foreground">
              Your recent signed documents are stored locally on this device.
            </p>
          </div>
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear all
            </Button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">No signed documents yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              After you apply signatures or stamps in the editor, they'll appear here.
            </p>
            <Link to="/app" className="mt-4">
              <Button className="bg-gradient-brand text-primary-foreground">Open editor</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,1.4fr)]">
            <div className="space-y-2">
              {entries.map((e) => {
                const active = e.id === previewId;
                return (
                  <div
                    key={e.id}
                    onClick={() => setPreviewId(e.id)}
                    className={`cursor-pointer rounded-xl border bg-card p-4 transition ${
                      active ? "border-primary shadow-brand" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{e.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.signedAt).toLocaleString()}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>{e.pages} page{e.pages !== 1 ? "s" : ""}</span>
                          <span>{e.placementCount} mark{e.placementCount !== 1 ? "s" : ""}</span>
                          <span>{formatSize(e.sizeBytes)}</span>
                        </div>
                        {e.signerEmail && (
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            Signed by {e.signerEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setPreviewId(e.id);
                        }}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                      </Button>
                      <a
                        href={e.dataUrl}
                        download={e.fileName}
                        onClick={(ev) => ev.stopPropagation()}
                        className="flex-1"
                      >
                        <Button size="sm" variant="outline" className="w-full">
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          remove(e.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky top-20 h-[calc(100vh-6rem)] rounded-xl border border-border bg-card p-3">
              {preview ? (
                <>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="truncate text-sm font-medium">{preview.fileName}</p>
                    <a href={preview.dataUrl} download={preview.fileName}>
                      <Button size="sm" variant="outline">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                      </Button>
                    </a>
                  </div>
                  <iframe
                    key={preview.id}
                    src={preview.dataUrl}
                    title={preview.fileName}
                    className="h-[calc(100%-2.5rem)] w-full rounded-lg border border-border bg-white"
                  />
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <FileText className="mb-2 h-8 w-8" />
                  Select a document to preview.
                  <br />
                  Hover over signatures and stamps in the PDF viewer to see the timestamp tooltip.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
