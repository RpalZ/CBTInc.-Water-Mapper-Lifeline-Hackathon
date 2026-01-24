This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Project Initialization

This project has been initialized with the following features:

*   **Next.js 15 App Router**: The latest version of Next.js with the App Router.
*   **PWA with Serwist**: The project is configured as a Progressive Web App using Serwist, with a service worker for offline capabilities.
*   **PowerSync**: The project is set up to use PowerSync for offline-first data synchronization.
*   **Supabase**: The project is configured to use Supabase as the backend, but you need to provide your own credentials.

### Next Steps

1.  **Create a `.env.local` file** in the root of the project.
2.  **Add the following environment variables** to the `.env.local` file:

    ```
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key
    NEXT_PUBLIC_POWERSYNC_URL=your-powersync-instance-url
    ```

3.  **Replace the placeholder values** with your actual Supabase and PowerSync credentials.
4.  **Run the app**: Run `npm run dev` to start the development server.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
