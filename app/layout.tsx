
import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from "next";
import LoginModalOnLoadWrapper from '../components/LoginModalOnLoadWrapper';

export const metadata: Metadata = {
  title: 'Smart Locations',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        
      >
  {/* Show login modal on page load */}
  <LoginModalOnLoadWrapper>{children}</LoginModalOnLoadWrapper>
      </body>
    </html>
  );
}
