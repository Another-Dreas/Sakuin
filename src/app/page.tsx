"use client";

import dynamic from "next/dynamic";

const AppWrapper = dynamic(
  () => import("@/components/layout/AppWrapper").then((mod) => mod.AppWrapper),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center min-h-[100dvh] w-full" style={{ background: "linear-gradient(135deg, #003B73 0%, #00529C 50%, #0095FF 100%)" }}>
         <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    ) 
  }
);

export default function Page() {
  return <AppWrapper>null</AppWrapper>;
}
