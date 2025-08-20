This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Media.cm Integration

This project includes integration with Media.cm for video hosting and management. Videos uploaded through the upload page are stored in your Media.cm account and can be browsed in the content page.

### Setup

1. Get your Media.cm API key from your account dashboard
2. Create a `.env.local` file in the root directory with:
   ```bash
   MEDIACM_API_KEY=your_media_cm_api_key_here
   ```
3. Restart your development server

### Features

- **Upload Videos**: Upload video files directly to Media.cm
- **Add Video Links**: Add videos from external URLs using Media.cm remote upload
- **Browse Library**: View all videos in your Media.cm account
- **Delete Videos**: Remove videos from your Media.cm account
- **Video Thumbnails**: Automatic thumbnail generation for uploaded videos

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
