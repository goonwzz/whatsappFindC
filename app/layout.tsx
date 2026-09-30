import type { Metadata } from "next";
import "./globals.css";
import "./results.css";
export const metadata: Metadata = { title: "贝贝家外贸复制系统", description: "可切换厂家和产品的海外客户探索与WhatsApp触达系统" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html>; }
