import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ThemeClientWrapper } from "../components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={inter.className}>
        <ThemeClientWrapper>{children}</ThemeClientWrapper>
      </body>
    </html>
  );
}
