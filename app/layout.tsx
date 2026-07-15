import type { Metadata, Viewport } from "next";
import { Poppins, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Maestranza Modelo PRO",
    template: "%s | Maestranza Modelo PRO",
  },
  description:
    "Plataforma de Boiler Comp y Soldesp para control operacional, planificación, HSEQ y trazabilidad industrial.",
  icons: {
    icon: "/brand/partners/logo-soldesp-full.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-navy-dark text-white">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
