'use client';

import type { AppInstance } from '@/lib/app-types';

interface Props {
  app: AppInstance;
}

export default function SmartlexDocAIRuntime({ app }: Props) {
  const url = (app.config?.url as string) ?? 'http://177.7.46.87:3002';

  return (
    <div className="flex h-full flex-col">
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        title={app.name}
        allow="fullscreen"
      />
    </div>
  );
}
