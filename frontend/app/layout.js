import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "MailDoor — Secure Email Gateway",
  description:
    "Send emails through Gmail API with secure API key management, audit trails, and role-based access control.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
