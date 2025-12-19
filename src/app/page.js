'use client';

import dynamic from "next/dynamic";

const AframeScene = dynamic(() => import("../components/AframeScene"), {
  ssr: false,
   loading: () => <div className="flex h-screen w-screen items-center justify-center">Loading scene...</div>,
});

export default function Home() {
  return <AframeScene />;
}
