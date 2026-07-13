'use client';

import dynamic from 'next/dynamic';

const ExcalidrawCanvas = dynamic(() => import('./ExcalidrawCanvas'), { ssr: false });

export default function CanvasPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white/90">Lienzo de trabajo</h1>
          <p className="text-xs text-white/40">Dibujá diagramas, arquitecturas y flujos</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span>Ctrl+Z para deshacer</span>
          <span>·</span>
          <span>Ctrl+S para guardar</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ExcalidrawCanvas />
      </div>
    </div>
  );
}
