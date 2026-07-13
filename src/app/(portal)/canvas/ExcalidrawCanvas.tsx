'use client';

export default function ExcalidrawCanvas() {
  return (
    <iframe
      src="https://excalidraw.com"
      style={{ width: '100%', height: '100%', border: 'none' }}
      allow="clipboard-read; clipboard-write"
      title="Lienzo de trabajo"
    />
  );
}
