import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Stamp as StampIcon,
  PenTool,
  Trash2,
  Download,
  CalendarDays,
  LogOut,
  Loader2,
  Move,
  FileText,
  Plus,
  Pencil,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignatureCanvas from "react-signature-canvas";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: AppPage,
  head: () => ({ meta: [{ title: "SignStamp — Sign & Stamp" }] }),
});

type Asset =
  | { id: string; kind: "signature"; dataUrl: string; label: string }
  | { id: string; kind: "stamp"; variant: "text"; text: string; color: string; label: string }
  | { id: string; kind: "stamp"; variant: "image"; dataUrl: string; label: string };

type Placement = {
  id: string;
  assetId: string;
  // ratios (0..1) relative to page size
  xRatio: number;
  yRatio: number;
  wRatio: number;
  withDate: boolean;
};

const STAMP_PRESETS: { text: string; color: string; label: string }[] = [
  { text: "APPROVED", color: "#059669", label: "Approved" },
  { text: "PAID", color: "#1d4ed8", label: "Paid" },
  { text: "RECEIVED", color: "#eb6734", label: "Received" },
  { text: "CONFIDENTIAL", color: "#dc2626", label: "Confidential" },
  { text: "CERTIFIED", color: "#7c3aed", label: "Certified" },
  { text: "DRAFT", color: "#525252", label: "Draft" },
  { text: "REJECTED", color: "#b91c1c", label: "Rejected" },
  { text: "URGENT", color: "#ea580c", label: "Urgent" },
];

const ASSETS_KEY = "signstamp.assets.v1";

type PageRangeMode = "all" | "first" | "last" | "custom";

function AppPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pageSizes, setPageSizes] = useState<{ w: number; h: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [sigOpen, setSigOpen] = useState(false);
  const [stampOpen, setStampOpen] = useState(false);
  const [rangeMode, setRangeMode] = useState<PageRangeMode>("all");
  const [customRange, setCustomRange] = useState("");
  const [applying, setApplying] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    try {
      const raw = localStorage.getItem(ASSETS_KEY);
      if (raw) setAssets(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(ASSETS_KEY, JSON.stringify(assets)); } catch {}
  }, [assets]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function onUpload(file: File) {
    setLoadingPdf(true);
    setOutputUrl(null);
    setPlacements([]);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      setPdfFile(file);
      setPdfBytes(buf);
      const pdfjs: any = await import("pdfjs-dist");
      // @ts-ignore vite ?url
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const doc = await pdfjs.getDocument({ data: buf.slice() }).promise;
      const imgs: string[] = [];
      const sizes: { w: number; h: number }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        imgs.push(canvas.toDataURL("image/jpeg", 0.85));
        const base = page.getViewport({ scale: 1 });
        sizes.push({ w: base.width, h: base.height });
      }
      setPageImages(imgs);
      setPageSizes(sizes);
      setCurrentPage(0);
      toast.success(`Loaded ${doc.numPages} page${doc.numPages > 1 ? "s" : ""}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Could not read PDF: " + err.message);
    } finally {
      setLoadingPdf(false);
    }
  }

  function addPlacement(assetId: string) {
    if (!pageImages.length) return;
    const p: Placement = {
      id: crypto.randomUUID(),
      assetId,
      xRatio: 0.55,
      yRatio: 0.75,
      wRatio: 0.25,
      withDate: false,
    };
    setPlacements((prev) => [...prev, p]);
    setSelectedPlacement(p.id);
  }

  function updatePlacement(id: string, patch: Partial<Placement>) {
    setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removePlacement(id: string) {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlacement === id) setSelectedPlacement(null);
  }

  function resolvePages(total: number): number[] {
    if (rangeMode === "all") return Array.from({ length: total }, (_, i) => i);
    if (rangeMode === "first") return [0];
    if (rangeMode === "last") return [total - 1];
    // custom: "1,3,5-8"
    const set = new Set<number>();
    customRange.split(",").forEach((chunk) => {
      const t = chunk.trim();
      if (!t) return;
      if (t.includes("-")) {
        const [a, b] = t.split("-").map((n) => parseInt(n.trim(), 10));
        if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) if (i >= 1 && i <= total) set.add(i - 1);
      } else {
        const n = parseInt(t, 10);
        if (!isNaN(n) && n >= 1 && n <= total) set.add(n - 1);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }

  async function apply() {
    if (!pdfBytes || !placements.length) return toast.error("Add at least one signature or stamp");
    setApplying(true);
    setOutputUrl(null);
    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBytes.slice());
      const totalPages = pdfDoc.getPageCount();
      const targetPages = resolvePages(totalPages);
      if (!targetPages.length) throw new Error("No pages selected in range");

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const today = new Date().toLocaleDateString();

      // Pre-embed signature + image-stamp images
      const embeddedImages = new Map<string, any>();
      for (const a of assets) {
        if (a.kind === "signature" || (a.kind === "stamp" && a.variant === "image")) {
          const dataUrl = (a as any).dataUrl as string;
          const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
          const isJpeg = dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg");
          embeddedImages.set(a.id, isJpeg ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes));
        }
      }

      for (const pageIdx of targetPages) {
        const page = pdfDoc.getPage(pageIdx);
        const { width: pw, height: ph } = page.getSize();
        for (const pl of placements) {
          const asset = assets.find((a) => a.id === pl.assetId);
          if (!asset) continue;
          const w = pl.wRatio * pw;
          if (asset.kind === "signature") {
            const img = embeddedImages.get(asset.id);
            const ratio = img.height / img.width;
            const h = w * ratio;
            const x = pl.xRatio * pw;
            const y = ph - pl.yRatio * ph - h;
            page.drawImage(img, { x, y, width: w, height: h });
            if (pl.withDate) {
              page.drawText(today, { x, y: y - 14, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
            }
          } else if (asset.variant === "image") {
            const img = embeddedImages.get(asset.id);
            const ratio = img.height / img.width;
            const h = w * ratio;
            const x = pl.xRatio * pw;
            const y = ph - pl.yRatio * ph - h;
            page.drawImage(img, { x, y, width: w, height: h });
            if (pl.withDate) {
              page.drawText(today, { x, y: y - 14, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
            }
          } else {
            // stamp: draw text with box
            const size = Math.max(14, w * 0.16);
            const text = asset.text.toUpperCase();
            const textWidth = font.widthOfTextAtSize(text, size);
            const boxW = Math.max(textWidth + 24, w);
            const boxH = size + 20 + (pl.withDate ? 14 : 0);
            const x = pl.xRatio * pw;
            const y = ph - pl.yRatio * ph - boxH;
            const [r, g, b] = hexToRgb(asset.color);
            page.drawRectangle({
              x, y, width: boxW, height: boxH,
              borderColor: rgb(r, g, b), borderWidth: 2.5,
              rotate: degrees(-6),
            });
            page.drawText(text, {
              x: x + 12, y: y + boxH - size - 6,
              size, font, color: rgb(r, g, b), rotate: degrees(-6),
            });
            if (pl.withDate) {
              page.drawText(today, {
                x: x + 12, y: y + 6, size: 9, font, color: rgb(r, g, b), rotate: degrees(-6),
              });
            }
          }
        }
      }

      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      setOutputUrl(URL.createObjectURL(blob));
      toast.success(`Applied to ${targetPages.length} page${targetPages.length > 1 ? "s" : ""}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Nav */}
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
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 p-4 lg:grid-cols-[320px_1fr_320px]">
        {/* LEFT: assets */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Document</h3>
            {!pdfFile ? (
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 p-6 text-center transition hover:border-primary hover:bg-primary/5">
                <Upload className="h-8 w-8 text-primary" />
                <p className="mt-2 text-sm font-medium">Upload PDF</p>
                <p className="text-xs text-muted-foreground">Drop or click to browse</p>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                />
              </label>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  <FileText className="h-5 w-5 flex-none text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pdfFile.name}</p>
                    <p className="text-xs text-muted-foreground">{pageImages.length} pages</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setPdfFile(null); setPdfBytes(null); setPageImages([]); setPlacements([]); setOutputUrl(null); }}>
                  Replace
                </Button>
              </div>
            )}
            {loadingPdf && <div className="mt-3 flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rendering…</div>}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">My assets</h3>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setSigOpen(true)}>
                <PenTool className="mr-1.5 h-3.5 w-3.5" /> Signature
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setStampOpen(true)}>
                <StampIcon className="mr-1.5 h-3.5 w-3.5" /> Stamp
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {assets.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No signatures or stamps yet</p>}
              {assets.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
                  <div className="flex h-10 w-16 flex-none items-center justify-center overflow-hidden rounded bg-white">
                    {a.kind === "signature" ? (
                      <img src={a.dataUrl} alt="" className="max-h-full max-w-full object-contain" />
                    ) : a.variant === "image" ? (
                      <img src={a.dataUrl} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-extrabold tracking-widest" style={{ color: a.color, border: `1.5px solid ${a.color}`, padding: "1px 4px" }}>{a.text.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.kind}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => addPlacement(a.id)} disabled={!pageImages.length}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAssets((prev) => prev.filter((x) => x.id !== a.id))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MIDDLE: preview */}
        <main className="rounded-xl border border-border bg-card p-4">
          {!pageImages.length ? (
            <div className="flex h-[70vh] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">Upload a PDF to begin</h3>
              <p className="mt-2 text-sm text-muted-foreground">Drag your document into the panel on the left.</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Page</span>
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                  >
                    {pageImages.map((_, i) => (
                      <option key={i} value={i}>{i + 1} / {pageImages.length}</option>
                    ))}
                  </select>
                </div>
                <p className="hidden text-xs text-muted-foreground md:block">
                  <Move className="mr-1 inline h-3 w-3" /> Drag placements to reposition. They apply to your selected page range.
                </p>
              </div>
              <PagePreview
                image={pageImages[currentPage]}
                pageSize={pageSizes[currentPage]}
                placements={placements}
                assets={assets}
                selected={selectedPlacement}
                onSelect={setSelectedPlacement}
                onChange={updatePlacement}
              />
            </>
          )}
        </main>

        {/* RIGHT: settings */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Page range</h3>
            <RadioGroup value={rangeMode} onValueChange={(v) => setRangeMode(v as PageRangeMode)} className="mt-3 space-y-1.5">
              {[
                { v: "all", l: "Entire document" },
                { v: "first", l: "First page only" },
                { v: "last", l: "Last page only" },
                { v: "custom", l: "Custom pages" },
              ].map((o) => (
                <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm">
                  <RadioGroupItem value={o.v} id={`r-${o.v}`} />
                  <span>{o.l}</span>
                </label>
              ))}
            </RadioGroup>
            {rangeMode === "custom" && (
              <Input
                className="mt-3"
                placeholder="e.g. 1,3,5-8"
                value={customRange}
                onChange={(e) => setCustomRange(e.target.value)}
              />
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Selected placement</h3>
            {(() => {
              const pl = placements.find((p) => p.id === selectedPlacement);
              if (!pl) return <p className="mt-3 text-xs text-muted-foreground">Add a signature or stamp, then click it on the preview to edit.</p>;
              const asset = assets.find((a) => a.id === pl.assetId);
              return (
                <div className="mt-3 space-y-4">
                  <div className="rounded-md bg-muted/40 p-2 text-xs">
                    <span className="font-medium">{asset?.label}</span> · {asset?.kind}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Size</Label>
                      <span className="text-xs text-muted-foreground">{Math.round(pl.wRatio * 100)}%</span>
                    </div>
                    <Slider
                      value={[pl.wRatio * 100]}
                      min={5} max={80} step={1}
                      onValueChange={(v) => updatePlacement(pl.id, { wRatio: v[0] / 100 })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="withdate" className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4" /> Include today's date
                    </Label>
                    <Switch id="withdate" checked={pl.withDate} onCheckedChange={(v) => updatePlacement(pl.id, { withDate: v })} />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => removePlacement(pl.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove placement
                  </Button>
                </div>
              );
            })()}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <Button
              disabled={!pdfBytes || applying || placements.length === 0}
              className="w-full bg-gradient-brand text-primary-foreground shadow-brand hover:opacity-95"
              onClick={apply}
            >
              {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <StampIcon className="mr-2 h-4 w-4" />}
              Apply & generate PDF
            </Button>
            {outputUrl && (
              <a href={outputUrl} download={pdfFile ? `signed-${pdfFile.name}` : "signed.pdf"} className="mt-3 block">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </a>
            )}
          </div>
        </aside>
      </div>

      <SignatureDialog
        open={sigOpen}
        onOpenChange={setSigOpen}
        onSave={(dataUrl, label) => {
          setAssets((prev) => [...prev, { id: crypto.randomUUID(), kind: "signature", dataUrl, label }]);
          setSigOpen(false);
          toast.success("Signature saved");
        }}
      />
      <StampDialog
        open={stampOpen}
        onOpenChange={setStampOpen}
        onSave={(asset) => {
          setAssets((prev) => [...prev, asset]);
          setStampOpen(false);
          toast.success("Stamp added");
        }}
      />
    </div>
  );
}

function PagePreview({
  image, pageSize, placements, assets, selected, onSelect, onChange,
}: {
  image: string;
  pageSize?: { w: number; h: number };
  placements: Placement[];
  assets: Asset[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Placement>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  function onMouseDown(e: React.MouseEvent, pl: Placement) {
    e.stopPropagation();
    onSelect(pl.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = { id: pl.id, ox: e.clientX - rect.left, oy: e.clientY - rect.top };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragRef.current.ox;
    const y = e.clientY - rect.top - dragRef.current.oy;
    onChange(dragRef.current.id, {
      xRatio: Math.max(0, Math.min(1, x / rect.width)),
      yRatio: Math.max(0, Math.min(1, y / rect.height)),
    });
  }
  function onMouseUp() { dragRef.current = null; }

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={() => onSelect(null)}
      className="relative mx-auto max-h-[75vh] w-fit overflow-auto rounded-lg border border-border bg-muted/20 shadow-soft"
    >
      <img src={image} alt="page" className="block max-h-[75vh] select-none" draggable={false} />
      {placements.map((pl) => {
        const asset = assets.find((a) => a.id === pl.assetId);
        if (!asset) return null;
        const isSel = selected === pl.id;
        return (
          <div
            key={pl.id}
            onMouseDown={(e) => onMouseDown(e, pl)}
            onClick={(e) => { e.stopPropagation(); onSelect(pl.id); }}
            className={`absolute cursor-move select-none ${isSel ? "ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-primary/40"}`}
            style={{
              left: `${pl.xRatio * 100}%`,
              top: `${pl.yRatio * 100}%`,
              width: `${pl.wRatio * 100}%`,
            }}
          >
            {asset.kind === "signature" ? (
              <img src={asset.dataUrl} alt="sig" className="pointer-events-none w-full" draggable={false} />
            ) : asset.variant === "image" ? (
              <img src={asset.dataUrl} alt="stamp" className="pointer-events-none w-full" draggable={false} />
            ) : (
              <div
                className="pointer-events-none font-display font-extrabold uppercase tracking-widest"
                style={{
                  color: asset.color,
                  border: `2.5px solid ${asset.color}`,
                  padding: "6px 12px",
                  transform: "rotate(-6deg)",
                  textAlign: "center",
                  fontSize: "clamp(10px, 2vw, 22px)",
                }}
              >
                {asset.text}
                {pl.withDate && <div className="text-[9px] opacity-80">{new Date().toLocaleDateString()}</div>}
              </div>
            )}
            {pl.withDate && (asset.kind === "signature" || (asset.kind === "stamp" && asset.variant === "image")) && (
              <div className="pointer-events-none mt-0.5 text-[10px] font-medium text-foreground/80">
                {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SignatureDialog({
  open, onOpenChange, onSave,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (dataUrl: string, label: string) => void }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [tab, setTab] = useState("draw");
  const [typed, setTyped] = useState("");
  const [label, setLabel] = useState("My signature");
  const [uploaded, setUploaded] = useState<string | null>(null);

  useEffect(() => { if (!open) { setTyped(""); setUploaded(null); } }, [open]);

  function save() {
    if (tab === "draw") {
      if (!sigRef.current || sigRef.current.isEmpty()) return toast.error("Please draw your signature");
      const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
      onSave(dataUrl, label || "My signature");
    } else if (tab === "type") {
      if (!typed.trim()) return toast.error("Please type your signature");
      const canvas = document.createElement("canvas");
      canvas.width = 600; canvas.height = 180;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#111";
      ctx.font = "italic 72px 'Segoe Script', 'Brush Script MT', cursive";
      ctx.textBaseline = "middle";
      ctx.fillText(typed, 20, 90);
      onSave(canvas.toDataURL("image/png"), label || typed);
    } else if (tab === "upload") {
      if (!uploaded) return toast.error("Please upload an image");
      onSave(uploaded, label || "Uploaded signature");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create signature</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="draw" className="mt-4">
            <div className="rounded-lg border border-border bg-white">
              <SignatureCanvas ref={sigRef} penColor="#111" canvasProps={{ width: 460, height: 180, className: "w-full" }} />
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => sigRef.current?.clear()}>Clear</Button>
          </TabsContent>
          <TabsContent value="type" className="mt-4">
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Your name" />
            {typed && (
              <div className="mt-3 rounded-lg border border-border bg-white p-4 text-center">
                <span style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive", fontStyle: "italic", fontSize: 42 }}>{typed}</span>
              </div>
            )}
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <Input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader(); r.onload = () => setUploaded(r.result as string); r.readAsDataURL(f);
            }} />
            {uploaded && <img src={uploaded} alt="preview" className="mt-3 max-h-40 rounded border border-border bg-white p-2" />}
          </TabsContent>
        </Tabs>
        <div className="mt-2 space-y-2">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-gradient-brand text-primary-foreground">Save signature</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StampDialog({
  open, onOpenChange, onSave,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (asset: Asset) => void }) {
  const colors = ["#eb6734", "#dc2626", "#1d4ed8", "#059669", "#7c3aed", "#000000"];
  const [tab, setTab] = useState("presets");
  const [text, setText] = useState("APPROVED");
  const [color, setColor] = useState("#eb6734");
  const [label, setLabel] = useState("");
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [uploadLabel, setUploadLabel] = useState("");

  useEffect(() => {
    if (open) {
      setTab("presets"); setText("APPROVED"); setColor("#eb6734");
      setLabel(""); setUploaded(null); setUploadLabel("");
    }
  }, [open]);

  function addPreset(p: { text: string; color: string; label: string }) {
    onSave({ id: crypto.randomUUID(), kind: "stamp", variant: "text", text: p.text, color: p.color, label: p.label });
  }
  function saveCustom() {
    if (!text.trim()) return toast.error("Enter stamp text");
    onSave({
      id: crypto.randomUUID(), kind: "stamp", variant: "text",
      text: text.trim(), color, label: label.trim() || text.trim(),
    });
  }
  function saveUploaded() {
    if (!uploaded) return toast.error("Upload a stamp image");
    onSave({
      id: crypto.randomUUID(), kind: "stamp", variant: "image",
      dataUrl: uploaded, label: uploadLabel.trim() || "Uploaded stamp",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add stamp</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-4">
            <p className="mb-3 text-xs text-muted-foreground">Click a default style to add it to your stamps.</p>
            <div className="grid grid-cols-2 gap-2">
              {STAMP_PRESETS.map((p) => (
                <button
                  key={p.text}
                  type="button"
                  onClick={() => addPreset(p)}
                  className="flex items-center justify-center rounded-lg border border-border bg-white px-3 py-4 transition hover:border-primary hover:shadow-brand"
                >
                  <span
                    className="inline-block font-display font-extrabold uppercase tracking-widest"
                    style={{ color: p.color, border: `2.5px solid ${p.color}`, padding: "4px 10px", transform: "rotate(-6deg)", fontSize: 14 }}
                  >
                    {p.text}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Text</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={24} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={text} />
            </div>
            <div className="rounded-lg border border-border bg-white p-6 text-center">
              <span className="inline-block font-display text-2xl font-extrabold uppercase tracking-widest"
                style={{ color, border: `3px solid ${color}`, padding: "6px 14px", transform: "rotate(-6deg)" }}>
                {text || "PREVIEW"}
              </span>
            </div>
            <Button onClick={saveCustom} disabled={!text.trim()} className="w-full bg-gradient-brand text-primary-foreground">Save custom stamp</Button>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <p className="text-xs text-muted-foreground">Upload a PNG or JPG of your official stamp. Transparent PNGs work best.</p>
            <Input type="file" accept="image/png,image/jpeg" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader();
              r.onload = () => setUploaded(r.result as string);
              r.readAsDataURL(f);
            }} />
            {uploaded && (
              <div className="rounded-lg border border-border bg-[repeating-conic-gradient(#f4f4f5_0%_25%,#fff_0%_50%)_50%_/_16px_16px] p-4 text-center">
                <img src={uploaded} alt="stamp" className="mx-auto max-h-40" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={uploadLabel} onChange={(e) => setUploadLabel(e.target.value)} placeholder="Company stamp" />
            </div>
            <Button onClick={saveUploaded} disabled={!uploaded} className="w-full bg-gradient-brand text-primary-foreground">Save uploaded stamp</Button>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
