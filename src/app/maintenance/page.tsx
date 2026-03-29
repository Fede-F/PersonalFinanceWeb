"use client";

import { useEffect, useState } from "react";
import { Database, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.refresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <Database className="w-16 h-16 text-emerald-500 mx-auto" strokeWidth={1.5} />
            <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-zinc-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Sitio en <span className="text-emerald-500">Mantenimiento</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            No podemos conectar con la base de datos. Estamos trabajando para restablecer el servicio lo antes posible.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 text-left">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin-slow" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Chequeo Incremental</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs text-balance">
              Reintentando automáticamente en <span className="font-bold text-emerald-500 tabular-nums">{countdown}s</span>...
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => router.refresh()}
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Chequear Ahora
          </Button>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Gracias por tu paciencia. FinanceApp volverá pronto.
          </p>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
