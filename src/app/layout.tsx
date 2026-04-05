import "@/index.css";
import { Providers } from "./providers";
import { MobileNotice } from "@/components/MobileNotice";

export const metadata = {
  title: "FloatChat",
  description: "AI ocean data explorer bundled in Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MobileNotice />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
