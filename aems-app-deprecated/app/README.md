## Skeleton

### Commands

Command utilize the `yarn` package manager. If you do not have `yarn` installed, you can install it with the following command:

```bash
corepack enable
```

The following source code building and quality assurance commands are available:

```bash
# install dependencies
yarn install
# compile and generate artifacts
yarn compile
# run static analysis
yarn lint
# run tests and code coverage
yarn test
```

The following database commands are available:

```bash
# create a new database migration
yarn migrate:create
# run database migrations
yarn migrate:deploy
# reset the database
yarn migrate:reset
```

The following development commands are available:

```bash
# start the development server
yarn dev
```

The following production commands are available:

```bash
# build the production server
yarn build
# start the production server
yarn start
```

### Environment

Default environment variables are declared in the `.env` file. Overriding environment variables for development should be specified in the `.env.local` file. The `.env.local` file is not tracked by the version control system. Additionally, Nodejs environment specific variables can be specified in `.env.development`, `.env.test`, and `.env.production` files.

> <b>Note: </b>Only variables that differ from the default environment variables should be specified in these files.

Environment variables that are referenced in the frontend (client) must be prefixed with `NEXT_PUBLIC_`. These environment variables are inlined during the build process. If dynamic environment variables are required, they can be fetched from the server using Graphql, http(s), or a `Next.js` `getServerSideProps` function.

### Backend Development

The backend utilizes Prisma for the database schema declaration, generation, and migration. Changes are made to the `schema.prisma` file. Once schema changes are finalized, a new database migration should be created.

todo

### Frontend Development

todo

## Next.js

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Getting Started

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

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
