import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap,
  Stamp,
  PenTool,
  Move,
  Maximize2,
  Pencil,
  CalendarDays,
  FileText,
  Eye,
  Shield,
  Download,
  Share2,
  Sparkles,
  Rocket,
  Briefcase,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: Zap, title: "One-Click Multi-Page Signing", desc: "Sign every page instantly with a single click and consistent placement." },
  { icon: Stamp, title: "Bulk Multi-Page Stamping", desc: "Apply your official stamp across all pages or ranges in seconds." },
  { icon: PenTool, title: "Custom Signature Management", desc: "Draw, upload or type. Save multiple signatures for any document." },
  { icon: Move, title: "Adjustable Placement", desc: "Drag and drop your signature or stamp anywhere on the page." },
  { icon: Maximize2, title: "Resize with Precision", desc: "Fine-tune size to fit any layout without losing quality." },
  { icon: Pencil, title: "Edit Before Finalizing", desc: "Reposition or resize any placed element until you're ready." },
  { icon: CalendarDays, title: "Automatic Date Stamp", desc: "Add today's date automatically with your preferred format." },
  { icon: FileText, title: "Page Range Selection", desc: "Entire document, first, last, specific pages or custom ranges." },
  { icon: Eye, title: "Live Preview", desc: "See exactly what your document will look like before saving." },
  { icon: Shield, title: "Secure PDF Processing", desc: "Original formatting preserved. Processing stays in your browser." },
  { icon: Download, title: "Instant Download", desc: "Download completed PDFs immediately in high quality." },
  { icon: Share2, title: "Easy Sharing", desc: "Send via email, messaging apps, or cloud storage in a few clicks." },
];

const audience = [
  "Businesses", "Government agencies", "Legal firms", "Schools & universities",
  "Human Resources", "Finance departments", "Healthcare", "Real estate", "Freelancers",
];

const perks = [
  "Sign hundreds of pages in minutes",
  "Stamp multiple pages with one click",
  "Resize and reposition effortlessly",
  "Automatic date stamps",
  "Preserve original document quality",
  "Download and share instantly",
  "Secure, reliable, user-friendly",
  "Save hours of repetitive work",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
              <Stamp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">SignStamp</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#who" className="hover:text-foreground">Built for</a>
            <a href="#why" className="hover:text-foreground">Why SignStamp</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-brand text-primary-foreground shadow-brand hover:opacity-95">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Sign smarter. Stamp faster.
              </div>
              <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
                Powerful document<br />signing, made <span className="text-primary">effortless</span>.
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                SignStamp helps you sign, stamp and share PDFs in seconds. Bulk-apply
                across every page, drag to reposition, and download professional-quality
                documents instantly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-brand text-primary-foreground shadow-brand hover:opacity-95">
                    Start signing free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline">See features</Button>
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />No install</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Secure</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Free to start</div>
              </div>
            </div>
            <HeroMock />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Everything you need to sign and stamp any PDF.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for high-volume workflows. Loved by teams that value speed and accuracy.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-brand"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-y border-border bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Why SignStamp</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Cut hours of repetitive work into minutes.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Whether you're approving invoices, certifying reports, or stamping stacks
                of official documents, SignStamp turns tedious workflows into a couple of clicks.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
                  <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/15">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Built for */}
      <section id="who" className="py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Briefcase className="h-3.5 w-3.5 text-primary" /> Built for professionals
          </div>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            From solo consultants to enterprise teams.
          </h2>
          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
            {audience.map((a) => (
              <span
                key={a}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-soft"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 text-center shadow-brand md:p-16">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <Rocket className="mx-auto h-10 w-10 text-primary-foreground" />
            <h2 className="mt-4 font-display text-3xl font-extrabold text-primary-foreground md:text-4xl">
              Sign smarter. Stamp faster. Share instantly.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Transform your document workflow with a simple, powerful solution built
              for speed, accuracy and convenience.
            </p>
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Get started for free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-brand">
              <Stamp className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SignStamp</span>
          </div>
          <p>© {new Date().getFullYear()} SignStamp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-brand opacity-20 blur-2xl" />
      <div className="relative rotate-[-2deg] rounded-2xl border border-border bg-card p-4 shadow-brand">
        <div className="flex items-center gap-1.5 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-3 text-xs font-medium text-muted-foreground">contract-final.pdf</span>
        </div>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-white ring-1 ring-border">
          <div className="space-y-2 p-6">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="pt-6" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-11/12 rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
          {/* stamp */}
          <div className="absolute right-6 top-10 rotate-[-14deg]">
            <div className="rounded-md border-[3px] border-primary px-4 py-2 text-primary">
              <div className="font-display text-xl font-extrabold tracking-widest">APPROVED</div>
              <div className="text-[10px] font-semibold tracking-widest opacity-70">07 / 07 / 2026</div>
            </div>
          </div>
          {/* signature */}
          <div className="absolute bottom-8 left-6">
            <svg viewBox="0 0 220 60" className="h-16 w-40 text-foreground">
              <path
                d="M5 45 C 25 5, 45 60, 65 30 S 100 5, 130 40 S 180 20, 215 35"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="mt-1 border-t border-foreground/60 pt-1 text-[10px] font-medium text-muted-foreground">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
