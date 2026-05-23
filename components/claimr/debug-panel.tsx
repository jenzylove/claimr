"use client";

import { useState, useEffect, useRef } from "react";
import { useChainId } from "wagmi";
import { useAuth } from "@/lib/auth";
import { useJobs } from "@/lib/useJobs";
import { Bug, X, Download, Copy, Trash2 } from "lucide-react";

type LogEntry = {
  timestamp: string;
  type: "error" | "warn" | "info" | "tx" | "api";
  message: string;
  data?: any;
};

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tab, setTab] = useState<"state" | "logs">("state");
  const logsRef = useRef<LogEntry[]>([]);

  let chainId: number | undefined;
let user: any, authenticated: any, ready: any;
let jobs: any[] = [], isLoading = false, totalJobs = 0;

try {
  chainId = useChainId();
} catch (e) {}

try {
  const auth = useAuth();
  user = auth.user;
  authenticated = auth.authenticated;
  ready = auth.ready;
} catch (e) {}

try {
  const j = useJobs();
  jobs = j.jobs;
  isLoading = j.isLoading;
  totalJobs = j.totalJobs;
} catch (e) {}
  // Capture console errors automatically
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        type: "error",
        message: args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
      };
      logsRef.current = [...logsRef.current, entry].slice(-100);
      setLogs([...logsRef.current]);
      originalError(...args);
    };

    console.warn = (...args) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        type: "warn",
        message: args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
      };
      logsRef.current = [...logsRef.current, entry].slice(-100);
      setLogs([...logsRef.current]);
      originalWarn(...args);
    };

    // Catch unhandled promise rejections
    const onRejection = (event: PromiseRejectionEvent) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        type: "error",
        message: `Unhandled Promise: ${event.reason?.message || event.reason}`,
        data: event.reason?.stack,
      };
      logsRef.current = [...logsRef.current, entry].slice(-100);
      setLogs([...logsRef.current]);
    };
    window.addEventListener("unhandledrejection", onRejection);

    // Keyboard shortcut: Ctrl+Shift+D
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const fullState = {
    timestamp: new Date().toISOString(),
    auth: {
      ready,
      authenticated,
      email: user?.email,
      walletAddress: user?.walletAddress,
    },
    chain: {
      chainId,
    },
    jobs: {
      isLoading,
      totalJobs,
      jobsFound: jobs.length,
      myPostedJobs: jobs.filter(
        (j) => j.project.toLowerCase() === user?.walletAddress?.toLowerCase()
      ).length,
      myClaimedJobs: jobs.filter(
        (j) => j.creator.toLowerCase() === user?.walletAddress?.toLowerCase()
      ).length,
      jobsByStatus: {
        open: jobs.filter((j) => j.status === 0).length,
        claimed: jobs.filter((j) => j.status === 1).length,
        submitted: jobs.filter((j) => j.status === 2).length,
        completed: jobs.filter((j) => j.status === 3).length,
        cancelled: jobs.filter((j) => j.status === 4).length,
        failed: jobs.filter((j) => j.status === 5).length,
      },
      allJobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        amount: j.amount,
        status: j.status,
        creator: j.creator,
        project: j.project,
      })),
    },
    logs: logs.slice(-20),
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claimr-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(fullState, null, 2));
    alert("Debug state copied to clipboard!");
  };

  const handleClear = () => {
    logsRef.current = [];
    setLogs([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[#FF2D7A] px-3 py-2 text-xs font-medium text-white shadow-lg hover:bg-[#FF2D7A]/90 transition-all"
        title="Open Debug Panel (Ctrl+Shift+D)"
      >
        <Bug className="h-3.5 w-3.5" />
        Debug
        {logs.filter((l) => l.type === "error").length > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold">
            {logs.filter((l) => l.type === "error").length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[420px] max-h-[600px] rounded-xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-[#FF2D7A]" />
          <span className="text-sm font-semibold text-white">Claimr Debugger</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10" title="Copy state">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleExport} className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10" title="Export JSON">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleClear} className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10" title="Clear logs">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setIsOpen(false)} className="rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10" title="Close (Ctrl+Shift+D)">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10">
        <button
          onClick={() => setTab("state")}
          className={`flex-1 px-3 py-2 text-xs font-medium ${tab === "state" ? "text-[#FF2D7A] border-b-2 border-[#FF2D7A]" : "text-white/60"}`}
        >
          App State
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`flex-1 px-3 py-2 text-xs font-medium ${tab === "logs" ? "text-[#FF2D7A] border-b-2 border-[#FF2D7A]" : "text-white/60"}`}
        >
          Logs ({logs.length})
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {tab === "state" ? (
          <pre className="text-[10px] text-white/80 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(fullState, null, 2)}
          </pre>
        ) : (
          <div className="space-y-1">
            {logs.length === 0 && <p className="text-xs text-white/40 text-center py-4">No logs yet.</p>}
            {logs.slice().reverse().map((log, i) => (
              <div
                key={i}
                className={`rounded p-2 text-[10px] font-mono ${
                  log.type === "error" ? "bg-red-500/10 text-red-300" :
                  log.type === "warn" ? "bg-yellow-500/10 text-yellow-300" :
                  "bg-white/5 text-white/70"
                }`}
              >
                <div className="text-white/40 mb-0.5">{log.timestamp.split("T")[1].split(".")[0]} · {log.type}</div>
                {log.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-2 text-[10px] text-white/40 text-center">
        Ctrl+Shift+D to toggle · {logs.filter(l => l.type === "error").length} errors · {logs.length} total
      </div>
    </div>
  );
}