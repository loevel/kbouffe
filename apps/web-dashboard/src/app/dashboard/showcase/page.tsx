"use client";
import dynamic from "next/dynamic";

const ShowcaseContent = dynamic(() => import("./ShowcaseContent"), { ssr: false });

export default function ShowcasePage() {
  return <ShowcaseContent />;
}
