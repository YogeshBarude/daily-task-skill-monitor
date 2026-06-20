"use client";

import { StoreProvider } from "@/lib/storage";
import { MonitorApp } from "@/components/monitor-app";

export default function Home() {
  return (
    <StoreProvider>
      <MonitorApp />
    </StoreProvider>
  );
}
