import { MetadataRoute } from 'next';


export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tic Tac Toe",
    short_name: "Tic Tac Toe",
    description: "A new way to play Tic Tac Toe",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}