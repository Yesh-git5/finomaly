import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertCircle, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Bell, Check,
  CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck, Clock3,
  FileCheck2, FileSearch, FileText, Gauge, Home, Landmark, ListFilter, LoaderCircle,
  Menu, Moon, Plus, Search, ShieldAlert, ShieldCheck, Sun, Upload, Users, X, Zap,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey, getGetInvoiceQueryKey, getGetInvoicesQueryKey,
  getGetModelInfoQueryKey, getGetNotificationsQueryKey, getGetVendorQueryKey,
  getGetVendorsQueryKey, useAnalyzeInvoice, useGetDashboardSummary, useGetInvoice,
  useGetInvoices, useGetModelInfo, useGetNotifications, useGetVendor, useGetVendors,
  useReconcileItc, useReviewInvoice, useSimulateScenario,
} from '@workspace/api-client-react';
import type {
  InvoiceDetail, InvoiceInput, InvoiceSummary, ReviewInputAction,
  SimulationInputScenario, VendorSummary,
} from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 25_000, retry: 1 } } });

const navItems = [
  { label: 'Overview', href: '/', icon: Home },
  { label: 'Analyze invoice', href: '/analyze', icon: FileSearch },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Review queue', href: '/review', icon: ClipboardCheck },
  { label: 'Vendors', href: '/vendors', icon: Users },
  { label: 'ITC reconciliation', href: '/reconcile', icon: Landmark },
  { label: 'Scenario lab', href: '/simulator', icon: Activity },
  { label: 'Model notes', href: '/insights', icon: CircleHelp },
];

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><RouterShell /><Toaster /></TooltipProvider></QueryClientProvider>;
}

function RouterShell() {
  const [path] = useLocation();
  return <ErrorBoundary resetKey={path}><Shell><Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/analyze" component={AnalyzePage} />
    <Route path="/invoices" component={InvoicesPage} />
    <Route path="/invoices/:id" component={InvoicePage} />
    <Route path="/review" component={ReviewPage} />
    <Route path="/vendors" component={VendorsPage} />
    <Route path="/vendors/:id" component={VendorPage} />
    <Route path="/simulator" component={SimulatorPage} />
    <Route path="/reconcile" component={ReconcilePage} />
    <Route path="/insights" component={InsightsPage} />
    <Route component={NotFound} />
  </Switch></Shell></ErrorBoundary>;
}

function Shell({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('finomaly-theme') !== 'light');
  const notifications = useGetNotifications();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('finomaly-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => setMobileOpen(false), [path]);
  const activeLabel = navItems.find((n) => n.href === path)?.label ?? (path.startsWith('/invoices/') ? 'Invoice detail' : path.startsWith('/vendors/') ? 'Vendor profile' : 'Workspace');
  return <div className="app-shell flex">
    {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-nav" />}
    <aside className={`sidebar fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/10 transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[76px] items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/40"><Activity size={19} strokeWidth={2.4} /></div>
        <div><div className="text-[17px] font-bold tracking-[-.04em] text-slate-50">finomaly<span className="text-cyan-400">.</span></div><div className="text-[9px] font-semibold uppercase tracking-[.19em] text-slate-500">GST intelligence</div></div>
        <button className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/10 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-close-sidebar"><X size={17} /></button>
      </div>
      <div className="mx-4 mb-5 rounded-xl border border-white/10 bg-white/[.045] px-3 py-3">
        <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-500">Workspace</span><ChevronDown size={13} className="text-slate-500" /></div>
        <div className="mt-2 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/15 text-[11px] font-bold text-cyan-300">D</div><span className="text-xs font-medium text-slate-200">Demo User · CA Firm</span></div>
      </div>
      <div className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[.15em] text-slate-500">Workspace</div>
      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary navigation">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path === href || (href === '/invoices' && path.startsWith('/invoices/')) || (href === '/vendors' && path.startsWith('/vendors/'));
          return <Link href={href} key={href} data-testid={`link-nav-${href.replaceAll('/', '') || 'overview'}`} className={`nav-link flex items-center gap-3 rounded-lg px-3 py-[10px] text-[12px] font-medium ${active ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-400 hover:bg-white/[.055] hover:text-slate-100'}`}>
            <Icon size={16} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span>{label === 'Review queue' && <span className="ml-auto rounded-md bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">4</span>}
          </Link>;
        })}
      </nav>
      <div className="m-3 mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[.06] p-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-cyan-200"><ShieldCheck size={14} /> Decision support</div>
        <p className="mb-0 mt-1.5 text-[10px] leading-[1.55] text-slate-400">A risk signal is a prompt to review, not a verdict about a vendor.</p>
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-300/20 bg-indigo-400/15 text-[11px] font-bold text-indigo-200">RK</div>
        <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-slate-200">Demo User</div><div className="text-[10px] text-slate-500">CA Firm</div></div>
        <button onClick={() => setDark(!dark)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} data-testid="button-theme-toggle">{dark ? <Sun size={15} /> : <Moon size={15} />}</button>
      </div>
    </aside>
    <div className="main-area min-w-0 flex-1 md:ml-[248px]">
      <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)} data-testid="button-open-nav"><Menu size={18} /></button><div className="text-xs text-muted-foreground">Finomaly <span className="mx-1.5 opacity-50">/</span><span className="font-medium text-foreground">{activeLabel}</span></div></div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />GST rulebook current</div>
          <Link href="/review" aria-label="Notifications" data-testid="link-notifications" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted"><Bell size={17} />{(notifications.data?.length ?? 0) > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400" />}</Link>
          <div className="ml-1 hidden h-7 w-px bg-border sm:block" /><div className="hidden text-right sm:block"><div className="text-[11px] font-semibold">Demo User · CA Firm</div><div className="text-[9px] text-muted-foreground">Demo workspace</div></div>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 pb-20 pt-6 md:px-8 md:pb-10 md:pt-8">{children}</main>
      <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 border-t border-border bg-card/95 px-3 py-2 text-[10px] text-muted-foreground backdrop-blur md:static md:justify-start md:border-0 md:bg-transparent md:px-8 md:pb-5 md:pt-0">
        <ShieldAlert size={13} className="shrink-0 text-cyan-500" /><span><strong className="font-semibold text-foreground">Anomaly ≠ fraud.</strong> Signals support human review; they are not proof of wrongdoing.</span>
      </footer>
    </div>
  </div>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>{eyebrow && <div className="mb-2 text-[10px] font-bold uppercase tracking-[.17em] text-primary">{eyebrow}</div>}<h1 className="text-[25px] font-semibold tracking-[-.045em] md:text-[29px]">{title}</h1>{description && <p className="mb-0 mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">{description}</p>}</div>{action}
  </div>;
}

function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, testId }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean; testId?: string }) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/15',
    secondary: 'border border-border bg-card text-foreground hover:bg-muted',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'border border-rose-500/25 bg-rose-500/10 text-rose-500 hover:bg-rose-500/15',
  };
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`button inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}>{children}</button>;
}

function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return <div className="surface space-y-3 p-5" role="status" aria-label="Loading content" data-testid="status-loading">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>;
}
function QueryError({ onRetry }: { onRetry?: () => void }) {
  return <div className="surface flex flex-col items-center px-5 py-12 text-center" role="alert" data-testid="status-error"><AlertCircle size={24} className="mb-3 text-rose-500" /><div className="text-sm font-semibold">We couldn’t load this view</div><p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>{onRetry && <Button onClick={onRetry} variant="secondary">Try again</Button>}</div>;
}
function EmptyState({ title, detail, icon: Icon = FileCheck2 }: { title: string; detail: string; icon?: typeof FileCheck2 }) {
  return <div className="flex flex-col items-center px-5 py-12 text-center" data-testid="status-empty"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon size={19} /></div><div className="text-sm font-semibold">{title}</div><p className="mb-0 mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{detail}</p></div>;
}
function INR({ value, compact = false }: { value: number; compact?: boolean }) {
  return <span className="mono">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: compact ? 0 : 2, notation: compact ? 'compact' : 'standard' }).format(value || 0)}</span>;
}
function RiskPill({ level, score }: { level?: string; score?: number }) {
  const key = (level ?? (score !== undefined && score >= 70 ? 'High' : score !== undefined && score >= 40 ? 'Medium' : 'Low')).toLowerCase();
  const classes = key === 'high' ? 'bg-rose-500/12 text-rose-500 ring-rose-500/20' : key === 'medium' ? 'bg-amber-500/12 text-amber-600 ring-amber-500/20' : 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/20';
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${classes}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{level ?? key[0].toUpperCase() + key.slice(1)}{score !== undefined && <span className="mono opacity-80">{score}</span>}</span>;
}
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = { Pending: 'bg-indigo-500/10 text-indigo-500', 'Verified Genuine': 'bg-emerald-500/10 text-emerald-600', 'Needs Correction': 'bg-amber-500/10 text-amber-600', Escalated: 'bg-rose-500/10 text-rose-500' };
  return <span className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold ${styles[status] ?? 'bg-muted text-muted-foreground'}`}>{status}</span>;
}
function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="mb-0 text-[13px] font-semibold tracking-[-.02em]">{title}</h2>{detail && <p className="mb-0 mt-1 text-[10px] text-muted-foreground">{detail}</p>}</div>{action}</div>;
}
function InvoiceTable({ items, compact = false }: { items: InvoiceSummary[]; compact?: boolean }) {
  if (!items.length) return <EmptyState title="Nothing to review here" detail="When invoice records are available, they’ll appear in this list." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left"><thead><tr className="border-b border-border text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground"><th className="px-4 py-3">Invoice / vendor</th><th className="px-3 py-3">Date</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">Review</th><th className="w-8 px-3 py-3" /></tr></thead><tbody>
    {items.map((invoice) => <tr key={invoice.id} className="table-row border-b border-border/70 last:border-0 hover:bg-muted/45" data-testid={`row-invoice-${invoice.id}`}>
      <td className="px-4 py-3"><Link href={`/invoices/${invoice.id}`} data-testid={`link-invoice-${invoice.id}`} className="group block"><div className="text-[11px] font-semibold text-foreground group-hover:text-primary">{invoice.invoiceNumber}</div><div className="mt-1 max-w-[210px] truncate text-[10px] text-muted-foreground">{invoice.vendorName}<span className="mx-1.5 opacity-40">·</span><span className="mono">{invoice.vendorGstin}</span></div></Link></td>
      <td className="px-3 py-3 text-[10px] text-muted-foreground">{formatDate(invoice.invoiceDate)}</td>
      <td className="px-3 py-3 text-right text-[10px] font-medium"><INR value={invoice.totalAmount} compact /></td>
      <td className="px-3 py-3"><RiskPill level={invoice.riskLevel} score={invoice.riskScore} /></td>
      <td className="px-3 py-3"><StatusPill status={invoice.status} /></td>
      <td className="px-3 py-3"><Link href={`/invoices/${invoice.id}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Open ${invoice.invoiceNumber}`} data-testid={`link-open-invoice-${invoice.id}`}><ChevronRight size={15} /></Link></td>
    </tr>)}
  </tbody></table>{compact && items.length > 5 && <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">Showing the 5 most recent signals</div>}</div>;
}
function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
function KpiCard({ label, value, detail, icon: Icon, tone = 'indigo' }: { label: string; value: ReactNode; detail: string; icon: typeof Gauge; tone?: 'indigo' | 'cyan' | 'rose' | 'amber' }) {
  const toneClass = { indigo: 'bg-indigo-500/10 text-indigo-500', cyan: 'bg-cyan-500/10 text-cyan-600', rose: 'bg-rose-500/10 text-rose-500', amber: 'bg-amber-500/10 text-amber-600' }[tone];
  return <div className="surface p-4 md:p-5" data-testid={`kpi-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-start justify-between"><div className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{label}</div><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}><Icon size={15} /></div></div><div className="mt-3 text-[23px] font-semibold tracking-[-.05em]">{value}</div><div className="mt-1 text-[10px] text-muted-foreground">{detail}</div></div>;
}

function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetDashboardSummary();
  if (isLoading) return <><PageHeading eyebrow="Workspace overview" title="Invoice intelligence" description="A clear read on your GST invoice book and the signals worth a closer look." /><LoadingBlock rows={5} /></>;
  if (isError || !data) return <><PageHeading title="Invoice intelligence" /><QueryError onRetry={() => refetch()} /></>;
  const k = data.kpis;
  const maxTrend = Math.max(1, ...data.monthlyTrend.map((m) => m.invoices));
  return <div className="fade-up">
    <PageHeading eyebrow="Workspace overview" title="Invoice intelligence" description="Your GST invoice book, in focus. Review signals with context before taking action." action={<Link href="/analyze" data-testid="link-analyze-new" className="button inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90"><Plus size={15} /> Analyze invoice</Link>} />
    <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <KpiCard label="Invoices reviewed" value={k.totalInvoices.toLocaleString('en-IN')} detail="Across your tracked book" icon={FileText} />
      <KpiCard label="Flagged for review" value={k.flaggedInvoices.toLocaleString('en-IN')} detail={`${k.pendingReviews} awaiting a human decision`} icon={ShieldAlert} tone="amber" />
      <KpiCard label="High-risk signals" value={k.highRiskCount.toLocaleString('en-IN')} detail="Priority review recommended" icon={Zap} tone="rose" />
      <KpiCard label="Amount at risk" value={<INR value={k.amountAtRisk} compact />} detail={`Average risk score ${k.averageRiskScore}`} icon={Landmark} tone="cyan" />
    </div>
    <div className="mb-5 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
      <section className="surface p-4 md:p-5">
        <SectionTitle title="Invoice activity" detail="Monthly invoice volume against flagged invoices" action={<span className="rounded-md bg-muted px-2 py-1 text-[9px] text-muted-foreground">Last 6 months</span>} />
        {data.monthlyTrend.length ? <div className="flex h-[185px] items-end gap-3 border-b border-border/80 px-1 pt-5">
          {data.monthlyTrend.map((m, i) => <div key={`${m.month}-${i}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" data-testid={`chart-month-${i}`}>
            <div className="relative flex h-[130px] w-full max-w-[46px] items-end justify-center rounded-t-md bg-muted/70"><div className="relative flex w-full items-end justify-center rounded-t-md bg-indigo-500/75 transition-all" style={{ height: `${Math.max(6, m.invoices / maxTrend * 100)}%` }}><div className="absolute bottom-0 w-[45%] rounded-t-sm bg-cyan-300" style={{ height: `${m.invoices ? Math.max(8, m.flagged / m.invoices * 100) : 0}%` }} /></div></div>
            <span className="max-w-full truncate text-[9px] text-muted-foreground">{m.month}</span>
          </div>)}
        </div> : <EmptyState title="No trend data yet" detail="Activity will take shape as invoices are analyzed." />}
        <div className="mt-3 flex gap-4 text-[9px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-indigo-500/75" />Invoices</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-cyan-300" />Flagged</span></div>
      </section>
      <section className="surface p-4 md:p-5">
        <SectionTitle title="Risk distribution" detail="Signals are prioritized for human review" />
        <div className="space-y-4 pt-2">{data.riskDistribution.map((r) => {
          const total = Math.max(1, data.riskDistribution.reduce((sum, row) => sum + row.count, 0));
          const color = r.level === 'High' ? 'bg-rose-500' : r.level === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400';
          return <div key={r.level} data-testid={`distribution-${r.level.toLowerCase()}`}><div className="mb-1.5 flex justify-between text-[10px]"><span className="font-medium">{r.level} risk</span><span className="mono text-muted-foreground">{r.count} <span className="opacity-60">/ {Math.round(r.count / total * 100)}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: `${r.count / total * 100}%` }} /></div></div>;
        })}</div>
        <div className="mt-5 border-t border-border pt-4"><div className="mb-2 text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Common signal types</div><div className="flex flex-wrap gap-2">{data.anomalyTypes.slice(0, 4).map((item) => <span key={item.type} className="rounded-md border border-border px-2 py-1 text-[9px] text-muted-foreground">{item.type}<b className="ml-1.5 text-foreground">{item.count}</b></span>)}</div></div>
      </section>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <section className="surface overflow-hidden"><div className="p-4 pb-0 md:px-5"><SectionTitle title="Recent high-risk invoices" detail="Start with the strongest signals; make the final call with context." action={<Link href="/invoices?risk=High" className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary" data-testid="link-all-high-risk">View history <ArrowRight size={12} /></Link>} /></div><InvoiceTable items={data.recentHighRisk.slice(0, 5)} compact /></section>
      <section className="surface p-4 md:p-5"><SectionTitle title="Vendor watchlist" detail="Vendors with the strongest risk signals" action={<Link href="/vendors" className="text-[10px] font-semibold text-primary" data-testid="link-all-vendors">All vendors</Link>} />
        {data.topVendors.length ? <div className="space-y-1">{data.topVendors.slice(0, 5).map((v, i) => <Link href={`/vendors/${v.id}`} key={v.id} data-testid={`link-dashboard-vendor-${v.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">{initials(v.name)}</div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold">{v.name}</div><div className="text-[9px] text-muted-foreground">{v.invoiceCount} invoices · {v.state}</div></div><RiskPill score={v.riskScore} /><span className="sr-only">{i}</span></Link>)}</div> : <EmptyState title="No vendor signals yet" detail="Vendor patterns appear as invoice history builds." icon={Users} />}
      </section>
    </div>
  </div>;
}
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase(); }

function AnalyzePage() {
  const analyze = useAnalyzeInvoice();
  const qc = useQueryClient();
  const [mode, setMode] = useState<'manual' | 'upload'>('manual');
  const [result, setResult] = useState<InvoiceDetail | null>(null);
  const [form, setForm] = useState<InvoiceInput>({ invoiceNumber: '', vendorName: '', vendorGstin: '', invoiceDate: new Date().toISOString().slice(0, 10), buyerGstin: '', placeOfSupply: 'Maharashtra', hsnCode: '', description: '', itemCount: 1, taxableValue: 0, gstRate: 18, cgst: 0, sgst: 0, igst: 0, totalAmount: 0 });
  const update = (key: keyof InvoiceInput, value: string) => setForm((prev) => ({ ...prev, [key]: ['itemCount', 'taxableValue', 'gstRate', 'cgst', 'sgst', 'igst', 'totalAmount'].includes(key) ? Number(value) : value }));
  const chooseFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<InvoiceInput>;
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      alert('Upload a JSON invoice file with the expected invoice fields. You can also enter the values manually.');
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    analyze.mutate({ data: form }, { onSuccess: (invoice) => {
      setResult(invoice);
      void qc.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
    } });
  };
  return <div className="fade-up">
    <PageHeading eyebrow="Invoice intake" title="Analyze an invoice" description="Submit invoice details to compare GST rules with this vendor’s history. Review the signals; decide what they mean." />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.72fr)]">
      <section className="surface overflow-hidden">
        <div className="flex border-b border-border px-4 md:px-6"><button onClick={() => setMode('manual')} className={`border-b-2 px-3 py-4 text-[11px] font-semibold ${mode === 'manual' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`} data-testid="tab-manual">Enter details</button><button onClick={() => setMode('upload')} className={`border-b-2 px-3 py-4 text-[11px] font-semibold ${mode === 'upload' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`} data-testid="tab-upload">Upload invoice JSON</button></div>
        {mode === 'upload' && <div className="mx-4 mt-5 flex items-center gap-3 rounded-xl border border-dashed border-primary/35 bg-primary/[.045] p-4 md:mx-6"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Upload size={17} /></div><div className="min-w-0 flex-1"><div className="text-[11px] font-semibold">Import structured invoice fields</div><div className="mt-1 text-[10px] text-muted-foreground">Choose a JSON file. Values will populate the form for your confirmation.</div></div><label className="button inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[10px] font-semibold hover:bg-muted"><Upload size={13} /> Browse<input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => void chooseFile(e.target.files?.[0])} data-testid="input-invoice-upload" /></label></div>}
        <form onSubmit={submit} className="space-y-5 p-4 md:p-6">
          <div><div className="mb-3 flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">01</span><h2 className="m-0 text-[11px] font-semibold">Invoice identity</h2></div><div className="grid gap-3 sm:grid-cols-2">
            <Field label="Invoice number" name="invoiceNumber" required value={form.invoiceNumber} onChange={(v) => update('invoiceNumber', v)} placeholder="e.g. INV-2024-0182" />
            <Field label="Invoice date" name="invoiceDate" required type="date" value={form.invoiceDate} onChange={(v) => update('invoiceDate', v)} />
            <Field label="Vendor name" name="vendorName" required value={form.vendorName} onChange={(v) => update('vendorName', v)} placeholder="Registered vendor name" />
            <Field label="Vendor GSTIN" name="vendorGstin" required value={form.vendorGstin} onChange={(v) => update('vendorGstin', v.toUpperCase())} placeholder="27AAAAA0000A1Z5" />
            <Field label="Buyer GSTIN" name="buyerGstin" required value={form.buyerGstin} onChange={(v) => update('buyerGstin', v.toUpperCase())} placeholder="Your GSTIN" />
            <Field label="Place of supply" name="placeOfSupply" required value={form.placeOfSupply} onChange={(v) => update('placeOfSupply', v)} placeholder="State" />
          </div></div>
          <div><div className="mb-3 flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">02</span><h2 className="m-0 text-[11px] font-semibold">Line item & tax breakdown</h2></div><div className="grid gap-3 sm:grid-cols-2">
            <Field label="Description" name="description" required value={form.description} onChange={(v) => update('description', v)} placeholder="Goods or service description" />
            <Field label="HSN / SAC code" name="hsnCode" required value={form.hsnCode} onChange={(v) => update('hsnCode', v)} placeholder="e.g. 8471" />
            <Field label="Item count" name="itemCount" type="number" required value={String(form.itemCount)} onChange={(v) => update('itemCount', v)} />
            <Field label="GST rate (%)" name="gstRate" type="number" required value={String(form.gstRate)} onChange={(v) => update('gstRate', v)} />
            <Field label="Taxable value (₹)" name="taxableValue" type="number" required value={String(form.taxableValue)} onChange={(v) => update('taxableValue', v)} />
            <Field label="Total invoice value (₹)" name="totalAmount" type="number" required value={String(form.totalAmount)} onChange={(v) => update('totalAmount', v)} />
            <Field label="CGST (₹)" name="cgst" type="number" required value={String(form.cgst)} onChange={(v) => update('cgst', v)} />
            <Field label="SGST (₹)" name="sgst" type="number" required value={String(form.sgst)} onChange={(v) => update('sgst', v)} />
            <Field label="IGST (₹)" name="igst" type="number" required value={String(form.igst)} onChange={(v) => update('igst', v)} />
          </div></div>
          {analyze.isError && <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-500" role="alert" data-testid="status-analyze-error">Analysis could not be completed. Please check the entered details and retry.</div>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck size={13} className="text-cyan-500" />Your review remains the final decision</span><Button type="submit" disabled={analyze.isPending} testId="button-run-analysis">{analyze.isPending ? <><LoaderCircle size={14} className="animate-spin" /> Analyzing…</> : <><Zap size={14} /> Analyze invoice</>}</Button></div>
        </form>
      </section>
      <aside className="space-y-4">
        <div className="surface quiet-grid overflow-hidden p-5"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-primary"><Gauge size={17} /></div><div className="text-sm font-semibold">What analysis checks</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">GST consistency and invoice patterns are compared with this vendor’s observed history.</p><div className="mt-4 space-y-3">{['Tax split & rate consistency', 'Vendor amount patterns', 'Invoice field anomalies'].map((item, i) => <div key={item} className="flex items-center gap-2 text-[10px]"><span className="mono text-primary/80">0{i + 1}</span><span>{item}</span><Check size={12} className="ml-auto text-cyan-500" /></div>)}</div></div>
        <div className="surface border-cyan-500/20 bg-cyan-500/[.035] p-4"><div className="flex gap-2.5"><ShieldAlert size={15} className="mt-0.5 shrink-0 text-cyan-500" /><p className="m-0 text-[10px] leading-[1.7] text-muted-foreground"><b className="text-foreground">Anomaly does not mean fraud.</b> A signal identifies a difference worth checking. It is not an accusation or proof.</p></div></div>
        {result && <div className="surface p-4" data-testid="result-analysis"><div className="flex items-start justify-between"><div><div className="text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Analysis complete</div><div className="mt-1 text-sm font-semibold">{result.invoiceNumber}</div></div><RiskPill level={result.riskLevel} score={result.riskScore} /></div><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{result.explanation || 'Review the invoice signals below before making a decision.'}</p><Link href={`/invoices/${result.id}`} className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-primary" data-testid="link-result-details">Open full review <ArrowRight size={12} /></Link></div>}
      </aside>
    </div>
  </div>;
}
function Field({ label, name, value, onChange, type = 'text', placeholder, required = false }: { label: string; name: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-medium text-muted-foreground">{label}{required && <span className="ml-0.5 text-rose-500">*</span>}</span><input type={type} name={name} value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} data-testid={`input-${name}`} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-[11px] text-foreground placeholder:text-muted-foreground/60" /></label>;
}

function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('');
  const [status, setStatus] = useState('');
  const params = useMemo(() => ({ q: search || undefined, risk: risk ? risk as 'Low' | 'Medium' | 'High' : undefined, status: status || undefined, page: 1, perPage: 50 }), [search, risk, status]);
  const query = useGetInvoices(params, { query: { queryKey: getGetInvoicesQueryKey(params) } });
  const items = query.data?.items ?? [];
  return <div className="fade-up"><PageHeading eyebrow="Invoice register" title="Invoices" description={`${query.data?.total ?? '—'} invoices in your workspace. Search by invoice, vendor or GSTIN.`} action={<Link href="/analyze" className="button inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[11px] font-semibold text-primary-foreground" data-testid="link-add-invoice"><Plus size={14} /> Analyze invoice</Link>} />
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, vendor or GSTIN…" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-[11px]" aria-label="Search invoices" data-testid="input-invoice-search" /></div>
        <div className="flex gap-2"><label className="sr-only" htmlFor="risk-filter">Risk level</label><select id="risk-filter" value={risk} onChange={(e) => setRisk(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-[10px]" data-testid="select-risk-filter"><option value="">All risk levels</option><option>Low</option><option>Medium</option><option>High</option></select><label className="sr-only" htmlFor="status-filter">Review status</label><select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-[10px]" data-testid="select-status-filter"><option value="">All statuses</option><option>Pending</option><option>Verified Genuine</option><option>Needs Correction</option><option>Escalated</option></select><button onClick={() => { setSearch(''); setRisk(''); setStatus(''); }} className="rounded-lg border border-border px-3 text-muted-foreground hover:bg-muted" aria-label="Clear filters" data-testid="button-clear-filters"><X size={14} /></button></div>
      </div>
      {query.isLoading ? <LoadingBlock /> : query.isError ? <QueryError onRetry={() => query.refetch()} /> : <><InvoiceTable items={items} />{items.length === 0 && <div className="hidden" />}</>}
      {!!query.data && <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[10px] text-muted-foreground"><span>Showing {items.length ? (query.data.page - 1) * query.data.perPage + 1 : 0}–{Math.min(query.data.page * query.data.perPage, query.data.total)} of {query.data.total}</span><span className="mono">Page {query.data.page}</span></div>}
    </section>
  </div>;
}

function ReviewPage() {
  const [status, setStatus] = useState('');
  const params = useMemo(() => ({ status: status || undefined, page: 1, perPage: 100 }), [status]);
  const q = useGetInvoices(params, { query: { queryKey: getGetInvoicesQueryKey(params) } });
  const statuses = ['Pending', 'Needs Correction', 'Escalated'];
  const current = q.data?.items ?? [];
  return <div className="fade-up"><PageHeading eyebrow="Human review" title="Review queue" description="Triage signals, record your judgment, and keep decisions auditable." />
    <div className="mb-4 flex flex-wrap gap-2">{['', ...statuses].map((s) => <button key={s || 'all'} onClick={() => setStatus(s)} className={`rounded-lg border px-3 py-2 text-[10px] font-semibold ${status === s ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`} data-testid={`filter-review-${s.toLowerCase().replaceAll(' ', '-') || 'all'}`}>{s || 'All queue'}{s === 'Pending' && q.data && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 mono">{q.data.items.filter((i) => i.status === 'Pending').length}</span>}</button>)}</div>
    <section className="surface overflow-hidden"><div className="flex items-center justify-between border-b border-border p-4"><div className="flex items-center gap-2"><ClipboardCheck size={15} className="text-primary" /><span className="text-[11px] font-semibold">{status || 'Open reviews'}</span></div><span className="text-[10px] text-muted-foreground">{q.data?.total ?? '—'} invoices</span></div>{q.isLoading ? <LoadingBlock /> : q.isError ? <QueryError onRetry={() => q.refetch()} /> : <InvoiceTable items={current.filter((x) => !status || x.status === status)} />}</section>
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/[.04] p-3 text-[10px] leading-relaxed text-muted-foreground"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-cyan-500" /><span>Review actions are attributed and timestamped. An anomaly is a signal to investigate, not proof of fraud.</span></div>
  </div>;
}

function InvoicePage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const query = useGetInvoice(id, { query: { enabled: !!id, queryKey: getGetInvoiceQueryKey(id) } });
  const review = useReviewInvoice();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  if (query.isLoading) return <><PageHeading title="Invoice review" /><LoadingBlock rows={6} /></>;
  if (query.isError || !query.data) return <><Link href="/invoices" className="mb-5 inline-flex items-center gap-2 text-[11px] text-muted-foreground"><ArrowLeft size={14} /> Invoices</Link><QueryError onRetry={() => query.refetch()} /></>;
  const invoice = query.data;
  const decide = (action: ReviewInputAction) => {
    review.mutate({ id, data: { action, note } }, { onSuccess: (updated) => {
      qc.setQueryData(getGetInvoiceQueryKey(id), updated);
      void qc.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      setNote(''); setNotice(`Review recorded: ${action}.`);
    } });
  };
  return <div className="fade-up">
    <Link href="/invoices" className="mb-4 inline-flex items-center gap-2 text-[10px] font-medium text-muted-foreground hover:text-primary" data-testid="link-back-invoices"><ArrowLeft size={13} /> Invoice register</Link>
    <PageHeading eyebrow={`${invoice.invoiceNumber} · ${formatDate(invoice.invoiceDate)}`} title={invoice.vendorName} description={`${invoice.vendorGstin} · ${invoice.placeOfSupply || 'Place of supply not recorded'}`} action={<div className="flex items-center gap-2"><RiskPill level={invoice.riskLevel} score={invoice.riskScore} /><StatusPill status={invoice.status} /></div>} />
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard label="Invoice total" value={<INR value={invoice.totalAmount} compact />} detail={`${invoice.itemCount ?? '—'} line items`} icon={Landmark} />
      <KpiCard label="Taxable value" value={<INR value={invoice.taxableValue ?? 0} compact />} detail={`GST rate ${invoice.gstRate ?? '—'}%`} icon={FileText} tone="cyan" />
      <KpiCard label="Vendor median" value={<INR value={invoice.vendorMedian ?? 0} compact />} detail="Historical invoice amount" icon={Activity} tone="amber" />
      <KpiCard label="Risk score" value={`${invoice.riskScore} / 100`} detail={invoice.riskLevel + ' signal band'} icon={Gauge} tone="rose" />
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_.8fr]">
      <div className="space-y-4">
        <section className="surface p-4 md:p-5"><SectionTitle title="Why this invoice was flagged" detail="Model and rule signals are evidence to consider, not conclusions." />
          <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">{invoice.explanation || 'No narrative explanation was supplied for this invoice.'}</p>
          {invoice.reasons?.length ? <div className="space-y-2">{invoice.reasons.map((r, i) => <div key={`${r.code}-${i}`} className="flex items-start gap-3 rounded-lg border border-border p-3" data-testid={`reason-${r.code}`}><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${r.severity === 'high' ? 'bg-rose-500' : r.severity === 'med' ? 'bg-amber-400' : 'bg-cyan-500'}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-semibold">{r.message}</span><span className="mono text-[9px] text-muted-foreground">{r.code}</span></div><div className="mt-1 text-[9px] text-muted-foreground">Signal weight <span className="mono">{r.weight}</span></div></div><span className="rounded bg-muted px-1.5 py-1 text-[9px] uppercase text-muted-foreground">{r.severity}</span></div>)}</div> : <EmptyState title="No anomaly reasons provided" detail="Use invoice context and vendor history when assessing this record." icon={ShieldCheck} />}
        </section>
        <section className="surface p-4 md:p-5"><SectionTitle title="Invoice breakdown" detail="Tax composition and submitted fields" />
          <div className="grid gap-x-7 sm:grid-cols-2">{[['Invoice number', invoice.invoiceNumber], ['Vendor GSTIN', invoice.vendorGstin], ['Buyer GSTIN', invoice.buyerGstin || '—'], ['HSN / SAC', invoice.hsnCode || '—'], ['Description', invoice.description || '—'], ['Source', invoice.source || '—'], ['CGST', <INR value={invoice.cgst ?? 0} />], ['SGST', <INR value={invoice.sgst ?? 0} />], ['IGST', <INR value={invoice.igst ?? 0} />]].map(([k, v]) => <div key={String(k)} className="flex justify-between gap-2 border-b border-border/60 py-2.5 text-[10px]"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></div>)}</div>
        </section>
        <section className="surface p-4 md:p-5"><SectionTitle title="Vendor amount history" detail="Historical amounts can help put this invoice in context." />
          {invoice.vendorHistory?.length ? <div className="flex h-24 items-end gap-2">{invoice.vendorHistory.map((n, i) => { const max = Math.max(...(invoice.vendorHistory ?? [1]), 1); return <div key={`${n}-${i}`} className="group relative flex-1 rounded-t-sm bg-indigo-500/45 hover:bg-indigo-500/75" style={{ height: `${Math.max(8, n / max * 100)}%` }} title={`₹${n.toLocaleString('en-IN')}`}><span className="sr-only">Historical invoice {i + 1}: ₹{n}</span></div>; })}</div> : <EmptyState title="History is not available" detail="More vendor invoices will add context here." icon={Activity} />}
          <div className="mt-3 flex items-center justify-between text-[9px] text-muted-foreground"><span>Prior invoices</span><span>Median <b className="mono text-foreground"><INR value={invoice.vendorMedian ?? 0} /></b></span></div>
        </section>
      </div>
      <div className="space-y-4">
        <section className="surface p-4 md:p-5"><SectionTitle title="Your review" detail="Record a clear outcome and optional context." />
          <label className="mb-3 block"><span className="mb-1.5 block text-[10px] font-medium text-muted-foreground">Review note</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What did you verify? What needs follow-up?" className="w-full resize-y rounded-lg border border-input bg-background p-3 text-[10px] placeholder:text-muted-foreground/60" data-testid="input-review-note" /></label>
          {review.isError && <div role="alert" className="mb-3 text-[10px] text-rose-500" data-testid="status-review-error">Could not save review. Please try again.</div>}
          {notice && <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-[10px] text-emerald-600" role="status" data-testid="status-review-saved"><CheckCircle2 size={14} />{notice}</div>}
          <div className="grid gap-2"><Button onClick={() => decide('Verified Genuine')} disabled={review.isPending} variant="secondary" testId="button-verify-genuine"><Check size={14} /> Mark verified genuine</Button><Button onClick={() => decide('Needs Correction')} disabled={review.isPending} variant="secondary" testId="button-needs-correction"><FileCheck2 size={14} /> Request correction</Button><Button onClick={() => decide('Escalated')} disabled={review.isPending} variant="danger" testId="button-escalate"><ArrowUpRight size={14} /> Escalate for review</Button></div>
          {review.isPending && <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><LoaderCircle size={13} className="animate-spin" />Saving review…</div>}
        </section>
        <section className="surface p-4 md:p-5"><SectionTitle title="Decision history" detail="An audit trail of human review" />
          {invoice.reviewLogs?.length ? <div className="space-y-4">{invoice.reviewLogs.map((log, i) => <div key={`${log.timestamp}-${i}`} className="relative border-l border-border pl-4"><span className="absolute -left-[4px] top-1 h-2 w-2 rounded-full bg-primary" /><div className="flex justify-between gap-2 text-[10px] font-semibold">{log.action}<span className="font-normal text-muted-foreground">{formatDate(log.timestamp)}</span></div><p className="mb-1 mt-1 text-[9px] leading-relaxed text-muted-foreground">{log.note}</p><span className="text-[9px] text-muted-foreground">{log.reviewer}</span></div>)}</div> : <EmptyState title="No review actions yet" detail="Your recorded decisions will appear in this timeline." icon={Clock3} />}
        </section>
      </div>
    </div>
  </div>;
}

function VendorsPage() {
  const [q, setQ] = useState('');
  const vendors = useGetVendors();
  const filtered = (vendors.data ?? []).filter((v) => `${v.name} ${v.gstin} ${v.state}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="fade-up"><PageHeading eyebrow="Vendor intelligence" title="Vendors" description="See recurring patterns alongside each vendor’s invoice volume and observed risk signals." />
    <section className="surface overflow-hidden"><div className="flex items-center gap-3 border-b border-border p-4"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find vendor or GSTIN…" className="h-10 w-full rounded-lg border border-input bg-background pl-9 text-[11px]" aria-label="Search vendors" data-testid="input-vendor-search" /></div><span className="text-[10px] text-muted-foreground">{filtered.length} vendors</span></div>
      {vendors.isLoading ? <LoadingBlock /> : vendors.isError ? <QueryError onRetry={() => vendors.refetch()} /> : filtered.length === 0 ? <EmptyState title={q ? 'No matching vendors' : 'Vendor book is empty'} detail={q ? 'Try a different name or GSTIN.' : 'Vendor profiles will appear as invoices enter your workspace.'} icon={Users} /> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-border text-[9px] uppercase tracking-[.12em] text-muted-foreground"><th className="px-4 py-3">Vendor</th><th className="px-3 py-3">State</th><th className="px-3 py-3 text-right">Invoices</th><th className="px-3 py-3 text-right">Average amount</th><th className="px-3 py-3 text-right">Median amount</th><th className="px-3 py-3">Risk</th><th /></tr></thead><tbody>{filtered.map((v) => <VendorRow key={v.id} vendor={v} />)}</tbody></table></div>}
    </section>
  </div>;
}
function VendorRow({ vendor: v }: { vendor: VendorSummary }) {
  return <tr className="table-row border-b border-border/70 last:border-0 hover:bg-muted/45" data-testid={`row-vendor-${v.id}`}><td className="px-4 py-3"><Link href={`/vendors/${v.id}`} className="flex items-center gap-3" data-testid={`link-vendor-${v.id}`}><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{initials(v.name)}</div><div><div className="text-[11px] font-semibold">{v.name}</div><div className="mono mt-1 text-[9px] text-muted-foreground">{v.gstin}</div></div></Link></td><td className="px-3 py-3 text-[10px]">{v.state}</td><td className="px-3 py-3 text-right mono text-[10px]">{v.invoiceCount}</td><td className="px-3 py-3 text-right text-[10px]"><INR value={v.averageAmount} compact /></td><td className="px-3 py-3 text-right text-[10px]"><INR value={v.medianAmount} compact /></td><td className="px-3 py-3"><RiskPill score={v.riskScore} /></td><td className="pr-4"><ChevronRight size={14} className="text-muted-foreground" /></td></tr>;
}
function VendorPage() {
  const { id = '' } = useParams<{ id: string }>();
  const q = useGetVendor(id, { query: { enabled: !!id, queryKey: getGetVendorQueryKey(id) } });
  if (q.isLoading) return <><PageHeading title="Vendor profile" /><LoadingBlock rows={5} /></>;
  if (q.isError || !q.data) return <><Link href="/vendors" className="mb-4 inline-flex items-center gap-2 text-[10px] text-muted-foreground"><ArrowLeft size={13} /> Vendors</Link><QueryError onRetry={() => q.refetch()} /></>;
  const v = q.data;
  return <div className="fade-up"><Link href="/vendors" className="mb-4 inline-flex items-center gap-2 text-[10px] text-muted-foreground hover:text-primary" data-testid="link-back-vendors"><ArrowLeft size={13} /> Vendor register</Link>
    <div className="surface quiet-grid mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center md:p-7"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-lg font-bold text-primary">{initials(v.name)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h1 className="m-0 text-[24px] font-semibold tracking-[-.04em]">{v.name}</h1><RiskPill score={v.riskScore} /></div><div className="mono mt-1.5 text-[10px] text-muted-foreground">{v.gstin}<span className="mx-2 opacity-40">·</span>{v.state}</div></div><div className="rounded-lg border border-border bg-card/80 px-4 py-3"><div className="text-[9px] uppercase tracking-[.12em] text-muted-foreground">Typical GST rate</div><div className="mono mt-1 text-sm font-semibold">{v.typicalGstRate ?? '—'}{v.typicalGstRate !== undefined && '%'}</div></div></div>
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><KpiCard label="Invoice count" value={v.invoiceCount} detail="Invoices on record" icon={FileText} /><KpiCard label="Average amount" value={<INR value={v.averageAmount} compact />} detail="Observed invoice average" icon={Landmark} tone="cyan" /><KpiCard label="Median amount" value={<INR value={v.medianAmount} compact />} detail="Typical invoice amount" icon={Activity} tone="amber" /><KpiCard label="Risk score" value={`${v.riskScore} / 100`} detail="Pattern signal, not a verdict" icon={Gauge} tone="rose" /></div>
    <section className="surface overflow-hidden"><div className="p-4 pb-0"><SectionTitle title="Invoice history" detail="Individual invoice records associated with this vendor" /></div>{v.invoices?.length ? <InvoiceTable items={v.invoices} /> : <EmptyState title="No invoice history available" detail="Associated invoice records will appear here." />}</section>
    {v.timeline?.length ? <section className="surface mt-4 p-4 md:p-5"><SectionTitle title="Amount timeline" detail="Observed invoice values over time" /><div className="flex h-28 items-end gap-2">{v.timeline.map((t, i) => { const max = Math.max(...v.timeline!.map((x) => x.amount), 1); return <div key={`${t.date}-${i}`} className={`flex-1 rounded-t-sm ${t.anomaly ? 'bg-amber-400' : 'bg-indigo-500/45'}`} style={{ height: `${Math.max(7, t.amount / max * 100)}%` }} title={`${formatDate(t.date)} · ₹${t.amount.toLocaleString('en-IN')}`} />; })}</div></section> : null}
  </div>;
}

function SimulatorPage() {
  const simulate = useSimulateScenario();
  const qc = useQueryClient();
  const [scenario, setScenario] = useState<SimulationInputScenario>('Spike Amount');
  const [result, setResult] = useState<InvoiceDetail | null>(null);
  const scenarios: { key: SimulationInputScenario; title: string; detail: string; tag: string }[] = [
    { key: 'Spike Amount', title: 'Amount spike', detail: 'Invoice value moves sharply beyond this vendor’s norm.', tag: 'Vendor history' },
    { key: 'Duplicate Invoice', title: 'Possible duplicate', detail: 'Invoice identity resembles an existing record.', tag: 'Identity' },
    { key: 'Invalid GSTIN', title: 'Invalid GSTIN', detail: 'Vendor GSTIN structure or registration appears inconsistent.', tag: 'GST rules' },
    { key: 'Tax Mismatch', title: 'Tax mismatch', detail: 'Tax amounts do not align with expected rate and supply type.', tag: 'Tax logic' },
    { key: 'Just-Below-Threshold Splitting', title: 'Threshold splitting', detail: 'Several amounts sit just below a configured threshold.', tag: 'Pattern' },
    { key: 'Round-Number Bills', title: 'Round-number bills', detail: 'Invoice totals show an unusual concentration of round values.', tag: 'Pattern' },
  ];
  return <div className="fade-up"><PageHeading eyebrow="Learning environment" title="Scenario lab" description="Explore how different invoice patterns surface in the risk review workflow. Scenarios are synthetic and for evaluation only." />
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]"><section className="grid gap-3 sm:grid-cols-2">{scenarios.map((s) => <button key={s.key} onClick={() => setScenario(s.key)} className={`interactive rounded-xl border p-4 text-left ${scenario === s.key ? 'border-primary/45 bg-primary/[.07] ring-1 ring-primary/15' : 'border-border bg-card hover:border-primary/25'}`} data-testid={`scenario-${s.key.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}><div className="flex items-start justify-between"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${scenario === s.key ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}><Activity size={15} /></div><span className="rounded-md bg-muted px-2 py-1 text-[9px] text-muted-foreground">{s.tag}</span></div><div className="mt-4 text-[12px] font-semibold">{s.title}</div><p className="mb-0 mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{s.detail}</p></button>)}</section>
      <aside className="surface p-5"><div className="text-[9px] font-bold uppercase tracking-[.15em] text-primary">Selected scenario</div><h2 className="mb-1 mt-2 text-lg font-semibold tracking-[-.03em]">{scenarios.find((s) => s.key === scenario)?.title}</h2><p className="text-[10px] leading-relaxed text-muted-foreground">{scenarios.find((s) => s.key === scenario)?.detail}</p><div className="my-4 rounded-lg bg-muted/70 p-3"><div className="flex items-center gap-2 text-[10px] font-semibold"><ShieldCheck size={13} className="text-cyan-500" />Synthetic demonstration</div><p className="mb-0 mt-1 text-[9px] leading-relaxed text-muted-foreground">This creates a simulated invoice through the analysis service. It does not establish fraud or misconduct.</p></div><Button onClick={() => simulate.mutate({ data: { scenario } }, { onSuccess: (invoice) => { setResult(invoice); void qc.invalidateQueries({ queryKey: getGetInvoicesQueryKey() }); void qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } })} disabled={simulate.isPending} testId="button-run-scenario">{simulate.isPending ? <><LoaderCircle size={14} className="animate-spin" /> Running…</> : <><Zap size={14} /> Run scenario</>}</Button>
        {simulate.isError && <div className="mt-3 text-[10px] text-rose-500" role="alert" data-testid="status-scenario-error">Scenario could not be generated. Try again.</div>}
        {result && <div className="mt-4 rounded-lg border border-border p-3" data-testid="result-scenario"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold">Scenario signal</span><RiskPill level={result.riskLevel} score={result.riskScore} /></div><div className="mt-2 text-[10px] text-muted-foreground">{result.invoiceNumber} · {result.vendorName}</div><Link href={`/invoices/${result.id}`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-primary" data-testid="link-scenario-detail">Review result <ArrowRight size={12} /></Link></div>}
      </aside></div>
  </div>;
}

function ReconcilePage() {
  const reconcile = useReconcileItc();
  const [useSample, setUseSample] = useState(true);
  const result = reconcile.data;
  return <div className="fade-up"><PageHeading eyebrow="Input tax credit" title="ITC reconciliation" description="Compare your purchase register against GSTR-2B records and identify tax credit that needs attention." />
    <section className="surface mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600"><Landmark size={17} /></div><div><div className="text-[12px] font-semibold">Reconcile a register</div><div className="mt-1 text-[10px] text-muted-foreground">Run a sample reconciliation to review match and mismatch outcomes.</div></div></div><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-[10px] text-muted-foreground"><input type="checkbox" checked={useSample} onChange={(e) => setUseSample(e.target.checked)} className="accent-indigo-500" data-testid="input-use-sample" />Use sample data</label><Button onClick={() => reconcile.mutate({ data: { useSample } })} disabled={reconcile.isPending} testId="button-run-reconciliation">{reconcile.isPending ? <><LoaderCircle size={13} className="animate-spin" />Reconciling</> : <><Activity size={14} />Run reconciliation</>}</Button></div></section>
    {reconcile.isError && <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-[10px] text-rose-500" role="alert" data-testid="status-reconcile-error"><AlertCircle size={14} />Reconciliation did not complete. Check the data source and retry.</div>}
    {result ? <><div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5"><KpiCard label="Matched" value={result.matched} detail="Register ↔ GSTR-2B" icon={CheckCircle2} tone="cyan" /><KpiCard label="Missing in 2B" value={result.missingIn2b} detail="Check supplier filing" icon={AlertCircle} tone="amber" /><KpiCard label="Mismatched" value={result.mismatched} detail="Values differ" icon={Activity} tone="rose" /><KpiCard label="Extra in 2B" value={result.extraIn2b} detail="Not in purchase book" icon={FileText} /><KpiCard label="ITC at risk" value={<INR value={result.itcAtRisk} compact />} detail="Review before claim" icon={Landmark} tone="amber" /></div><section className="surface overflow-hidden"><div className="p-4 pb-0"><SectionTitle title="Reconciliation details" detail="Exceptions should be checked against source documents before action." /></div>{result.rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b border-border text-[9px] uppercase tracking-[.12em] text-muted-foreground"><th className="px-4 py-3">Vendor / invoice</th><th className="px-3 py-3">Match status</th><th className="px-3 py-3 text-right">Purchase register tax</th><th className="px-3 py-3 text-right">GSTR-2B tax</th><th className="px-3 py-3 text-right">Difference</th></tr></thead><tbody>{result.rows.map((row, i) => <tr key={`${row.invoiceNumber}-${i}`} className="border-b border-border/70 text-[10px] last:border-0" data-testid={`row-reconcile-${i}`}><td className="px-4 py-3"><div className="font-semibold">{row.vendor}</div><div className="mt-1 text-[9px] text-muted-foreground">{row.invoiceNumber}</div></td><td className="px-3 py-3"><span className={`rounded-md px-2 py-1 text-[9px] font-semibold ${row.status.toLowerCase().includes('match') && !row.status.toLowerCase().includes('mis') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{row.status}</span></td><td className="px-3 py-3 text-right"><INR value={row.registerTax} /></td><td className="px-3 py-3 text-right"><INR value={row.gstr2bTax} /></td><td className="px-3 py-3 text-right"><INR value={row.registerTax - row.gstr2bTax} /></td></tr>)}</tbody></table></div> : <EmptyState title="No reconciliation rows" detail="This run did not return line-level comparisons." />}</section></> : <section className="surface"><EmptyState title="Ready to reconcile" detail="Run a comparison to see matched invoices, exceptions and potential ITC exposure." icon={ListFilter} /></section>}
  </div>;
}

function InsightsPage() {
  const q = useGetModelInfo({ query: { queryKey: getGetModelInfoQueryKey() } });
  const model = q.data;
  return <div className="fade-up"><PageHeading eyebrow="Transparency & governance" title="How signals work" description="Understand the model’s inputs, its limits, and how human review fits into every decision." />
    {q.isLoading ? <LoadingBlock rows={5} /> : q.isError || !model ? <QueryError onRetry={() => q.refetch()} /> : <div className="grid items-start gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-4"><section className="surface p-5 md:p-6"><div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gauge size={18} /></div><div><div className="text-[9px] font-bold uppercase tracking-[.14em] text-primary">Current model</div><h2 className="mb-0 mt-1 text-base font-semibold">{model.algorithm}</h2></div></div><div className="grid gap-3 sm:grid-cols-3"><InfoCell label="Contamination" value={`${(model.contamination * 100).toFixed(1)}%`} /><InfoCell label="Model refreshed" value={formatDate(model.trainedAt)} /><InfoCell label="Scoring" value="Relative risk signal" /></div><p className="mb-0 mt-4 rounded-lg bg-muted/60 p-3 text-[10px] leading-relaxed text-muted-foreground">{model.dataNote}</p></section>
        <section className="surface p-5"><SectionTitle title="Signals & features" detail="Factors considered by the model and GST checks" /><div className="flex flex-wrap gap-2">{model.features.map((feature, i) => <span key={feature} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[10px]" data-testid={`feature-${i}`}><span className="mono text-[9px] text-primary">{String(i + 1).padStart(2, '0')}</span>{feature}</span>)}</div></section>
        <section className="surface border-cyan-500/20 bg-cyan-500/[.035] p-5"><div className="flex items-start gap-3"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-cyan-500" /><div><h2 className="mb-1 text-[12px] font-semibold">A risk score is not a finding of fraud</h2><p className="mb-0 text-[10px] leading-[1.75] text-muted-foreground">The model surfaces unusual patterns for a qualified person to examine. It may produce false positives and does not determine intent, legal compliance, or whether a transaction is genuine. Verify the underlying records, consider vendor context, and document your decision.</p></div></div></section></div>
      <div className="space-y-4"><section className="surface p-5"><SectionTitle title="Score distribution" detail="Observed scores in the current analysis set" />
        {model.scoreDistribution.length ? <div className="flex h-40 items-end gap-2 border-b border-border pb-1">{model.scoreDistribution.map((n, i) => { const max = Math.max(...model.scoreDistribution, 1); return <div key={`${i}-${n}`} className="group relative flex-1 rounded-t-sm bg-indigo-500/65 hover:bg-cyan-400" style={{ height: `${Math.max(4, n / max * 100)}%` }} title={`Band ${i + 1}: ${n}`}><span className="sr-only">Band {i + 1}: {n}</span></div>; })}</div> : <EmptyState title="Distribution unavailable" detail="Score distribution data has not been provided." icon={BarChart3} />}
        <div className="mt-3 flex justify-between text-[9px] text-muted-foreground"><span>Lower signal</span><span>Higher signal</span></div>
      </section><section className="surface p-5"><SectionTitle title="How to use the result" /><div className="space-y-4">{[['01', 'Inspect the evidence', 'Check the GST rule result, invoice fields and the vendor’s own history.'], ['02', 'Verify with source records', 'Compare against the original invoice, ledgers and filing information.'], ['03', 'Record a human decision', 'Mark a correction, verify the invoice, or escalate with a clear note.']].map(([n, t, d]) => <div key={n} className="flex gap-3"><span className="mono text-[10px] text-primary">{n}</span><div><div className="text-[10px] font-semibold">{t}</div><p className="mb-0 mt-1 text-[9px] leading-relaxed text-muted-foreground">{d}</p></div></div>)}</div></section></div>
    </div>}
  </div>;
}
function InfoCell({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-muted/60 p-3"><div className="text-[9px] text-muted-foreground">{label}</div><div className="mono mt-1 text-[11px] font-semibold">{value}</div></div>; }
function NotFound() { return <div className="surface flex min-h-[340px] flex-col items-center justify-center p-6 text-center"><div className="mono text-5xl font-semibold text-primary/25">404</div><h1 className="mt-4 text-lg font-semibold">This page isn’t in the ledger</h1><p className="mt-1 text-xs text-muted-foreground">The address may have changed or the page may not exist.</p><Link href="/" className="mt-4 text-xs font-semibold text-primary" data-testid="link-home">Return to overview</Link></div>; }

export default App;
