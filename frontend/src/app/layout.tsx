'use client'
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SocketContext, socket } from "./_components/socket";
import { Suspense } from "react";
import Loading from "./loading";

// const geistSans = localFont({
//   src: "./_fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./_fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

// export const metadata: Metadata = {
//   title: "Tic Tac Toe",
//   description: "A simple tic tac toe game",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <title>Tic Tac Toe</title>
      </head>
      <body
      
      >
        <SocketContext.Provider value={socket}>
          <Suspense fallback={<Loading />}>
            {children}
         </Suspense>
        </SocketContext.Provider>
      </body>
    </html>
  );
}




