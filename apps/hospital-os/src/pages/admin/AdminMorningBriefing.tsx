import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, Activity, IndianRupee, Users, Shield, Package, Zap,
  AlertTriangle, CheckCircle2, XCircle, Info, TrendingUp,
  RefreshCw, Terminal, Sparkles, Heart
} from 'lucide-react';
import { useMorningBriefing } from '@/lib/ai/hooks/useMorningBriefing';
import { canUseAIRuntime, platformExecuteAI } from '@/runtime/ai-runtime';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';

const SECTION_ICONS: Record<string, any> = {
  IndianRupee, Activity, Shield, Users, Package,
};

const STATUS_COLORS: Record<string, string> = {
  good: 'text-emerald-500',
  warning: 'text-amber-500',
  critical: 'text-red-500',
  neutral: 'text-muted-foreground',
};

const STATUS_BG: Record<string, string> = {
  good: 'bg-emerald-500/10 border-emerald-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  critical: 'bg-red-500/10 border-red-500/20',
  neutral: 'bg-muted/50 border-border',
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle },
  low: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Info },
  info: { color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Info },
};

const LINE_COLORS: Record<string, string> = {
  info: 'text-blue-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
};

const LINE_PREFIX: Record<string, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  critical: '✖',
};

export default function AdminMorningBriefing() {
  const briefing = useMorningBriefing();
  const [showTerminal, setShowTerminal] = useState(true);
  const [typedLines, setTypedLines] = useState<number>(0);
  const [platformAdvice, setPlatformAdvice] = useState<string[]>([]);
  const [platformHealth, setPlatformHealth] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const refreshPlatformBriefing = useCallback(async () => {
    if (!canUseAIRuntime()) {
      setPlatformAdvice([]);
      setPlatformHealth(null);
      return;
    }
    setAiRefreshing(true);
    setAiError(null);
    try {
      const res = await platformExecuteAI({ actionType: 'admin_morning_briefing' });
      const output = res.output ?? {};
      setPlatformAdvice(Array.isArray(output.advice) ? (output.advice as string[]) : []);
      setPlatformHealth(typeof output.healthStatus === 'string' ? output.healthStatus : null);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Platform briefing unavailable');
    } finally {
      setAiRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshPlatformBriefing();
  }, [refreshPlatformBriefing]);

  // Terminal typing animation
  const allTerminalLines: { text: string; type: string }[] = [];
  allTerminalLines.push({ text: `ADRINE AI COMMAND CENTER  |  Good Morning, Administrator`, type: 'info' });
  allTerminalLines.push({ text: `Generated: ${briefing.generatedAt}`, type: 'info' });
  allTerminalLines.push({ text: `Hospital Health Score: ${briefing.healthScore}/100 — ${briefing.healthLabel}`, type: briefing.healthScore >= 70 ? 'success' : briefing.healthScore >= 50 ? 'warning' : 'critical' });
  allTerminalLines.push({ text: '─'.repeat(70), type: 'info' });

  for (const section of briefing.briefingSections) {
    allTerminalLines.push({ text: `\n▸ ${section.title.toUpperCase()}`, type: 'info' });
    for (const line of section.lines) {
      allTerminalLines.push({ text: `  ${LINE_PREFIX[line.type] ?? '·'} ${line.text}`, type: line.type });
    }
  }

  const mergedAdvice = [...platformAdvice, ...briefing.advice];
  if (mergedAdvice.length > 0) {
    allTerminalLines.push({ text: '\n▸ AI RECOMMENDATIONS', type: 'info' });
    for (const a of mergedAdvice) {
      allTerminalLines.push({ text: `  → ${a}`, type: 'success' });
    }
  }
  if (platformHealth) {
    allTerminalLines.push({ text: `Platform health: ${platformHealth}`, type: platformHealth === 'healthy' ? 'success' : 'warning' });
  }

  useEffect(() => {
    if (!showTerminal) return;
    if (typedLines >= allTerminalLines.length) return;
    const timer = setTimeout(() => {
      setTypedLines(prev => prev + 1);
      terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(timer);
  }, [typedLines, showTerminal, allTerminalLines.length]);

  const handleRefresh = () => {
    setTypedLines(0);
    void refreshPlatformBriefing();
  };

  const scoreColor = briefing.healthScore >= 85 ? 'text-emerald-500' : briefing.healthScore >= 70 ? 'text-blue-500' : briefing.healthScore >= 55 ? 'text-amber-500' : 'text-red-500';
  const scoreGlow = briefing.healthScore >= 85 ? 'shadow-emerald-500/20' : briefing.healthScore >= 70 ? 'shadow-blue-500/20' : briefing.healthScore >= 55 ? 'shadow-amber-500/20' : 'shadow-red-500/20';

  return (
    <div className="space-y-4">
      {canUseAIRuntime() && (
        <PlatformConnectivityStrip
          label="Platform morning briefing"
          detail={platformHealth ? `Branch health: ${platformHealth}` : 'Loading domain AI briefing…'}
          error={aiError}
        />
      )}
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Command Center</h1>
            <p className="text-sm text-muted-foreground">Morning Briefing — powered by 7 Intelligence Layers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTerminal(!showTerminal)}>
            <Terminal className="w-4 h-4 mr-1" /> {showTerminal ? 'Dashboard' : 'Terminal'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={aiRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${aiRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Health Score + KPIs Row */}
      <div className="grid grid-cols-7 gap-3">
        {/* Health Score — larger card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className={`h-full border-2 ${STATUS_BG[briefing.healthScore >= 70 ? 'good' : briefing.healthScore >= 50 ? 'warning' : 'critical']} shadow-lg ${scoreGlow}`}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <Heart className={`w-5 h-5 ${scoreColor} mb-1`} />
              <p className={`text-3xl font-black ${scoreColor}`}>{briefing.healthScore}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">{briefing.healthLabel}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI Cards */}
        {briefing.kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
            <Card className={`h-full border ${STATUS_BG[kpi.status]}`}>
              <CardContent className="p-3 flex flex-col justify-between h-full">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-xl font-bold ${STATUS_COLORS[kpi.status]} mt-1`}>{kpi.value}</p>
                {kpi.trend && <p className="text-[10px] text-muted-foreground mt-1">{kpi.trend}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {showTerminal ? (
          /* ─── Terminal View ─── */
          <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs text-zinc-500 font-mono ml-2">adrine-ai-command-center — morning-briefing</p>
                  <Sparkles className="w-3 h-3 text-primary ml-auto animate-pulse" />
                </div>
                <div ref={terminalRef} className="p-4 font-mono text-sm overflow-y-auto max-h-[420px] space-y-0.5">
                  {allTerminalLines.slice(0, typedLines).map((line, i) => (
                    <div key={i} className={`${LINE_COLORS[line.type] ?? 'text-zinc-400'} leading-relaxed whitespace-pre-wrap`}>
                      {line.text}
                    </div>
                  ))}
                  {typedLines < allTerminalLines.length && (
                    <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ─── Dashboard View ─── */
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Briefing Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefing.briefingSections.map((section, si) => {
                const Icon = SECTION_ICONS[section.icon] ?? Activity;
                return (
                  <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08 }}>
                    <Card className="h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-sm">{section.title}</h3>
                        </div>
                        <div className="space-y-2">
                          {section.lines.map((line, li) => (
                            <div key={li} className="flex items-start gap-2 text-xs">
                              <span className={`mt-0.5 flex-shrink-0 ${LINE_COLORS[line.type]}`}>
                                {line.type === 'critical' ? <XCircle className="w-3.5 h-3.5" /> :
                                 line.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                 line.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                 <Info className="w-3.5 h-3.5" />}
                              </span>
                              <span className="text-foreground/80">{line.text}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* AI Advice */}
            {mergedAdvice.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">AI Recommendations</h3>
                  </div>
                  <div className="space-y-2">
                    {mergedAdvice.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Zap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/90">{a}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Alerts */}
            {briefing.topAlerts.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Top Alerts Across All Layers
                  </h3>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {briefing.topAlerts.map((alert, i) => {
                        const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
                        const AlertIcon = cfg.icon;
                        return (
                          <div key={alert.id ?? i} className={`flex items-start gap-3 p-2 rounded-md ${cfg.bg}`}>
                            <AlertIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">{alert.title}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                  {alert.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                              {alert.suggestedAction && (
                                <p className="text-[10px] text-primary mt-1">→ {alert.suggestedAction}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
