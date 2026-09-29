import "./globals.css";

export const metadata = {
  title: "Munshaat Action Tracker",
  description: "ElderWise / SilaCares Monshaat execution workbench"
};

export default function RootLayout({children}) {
  return <html lang="en"><body>{children}</body></html>;
}