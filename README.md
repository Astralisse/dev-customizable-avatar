# dev-customizable-avatar

This repository contains the source code of the initial prototype for a larger system we are building for Astralisse.

## Description

This prototype includes an ERC-5484 (soulbound) base NFT which is augmented with ERC-1155 cosmetic items. It is designed to work with all NFT marketplaces, providing **dynamic metadata** based on the owner's status and selected cosmetics.

The **React frontend** uses WalletConnect for maximum wallet support. Once a wallet is connected, the owner can mint tokens and select cosmetics to equip on their avatar. Additionally, a special item (clothing) may be automatically equipped depending on the owner's role in our **Discord server**.

Backend code is written as a **Node.js serverless** function and hosted on Cloudflare Workers, utilizing Cloudflare R2 for file storage. The frontend is hosted on Cloudflare Pages.

## Usage

To run the backend:
- create an R2 bucket called `dev` (see [Cloudflare docs](https://developers.cloudflare.com/r2/))
- create a file called `.dev.vars` containing the env variables `DISCORD_TOKEN`, `APP_ID` and `GUILD_ID`

Then:
```shell
cd backend
npm install
npm run dev
```

To run the frontend:
```shell
cd frontend
npm run dev -- --experimental-https
```
