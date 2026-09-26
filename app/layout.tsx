import type { Metadata } from "next";
import "./globals.css";
import "./results.css";
export const metadata: Metadata = { title: "贝贝家外贸复制系统", description: "杭州临安贝贝家公司外贸获客实地测试系统" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html>; }
