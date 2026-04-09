"use client";
import dynamic from "next/dynamic";

const ApprovisionnementDetailContent = dynamic(() => import("./ApprovisionnementDetailContent"), { ssr: false });

export default function ApprovisionnementDetailPage() {
  return <ApprovisionnementDetailContent />;
}
