---
id: installation
title: Installation
sidebar_label: Installation
---

## Requirements

- [Node.js](https://nodejs.org/en/download/) version >= 12 (which can be checked by running `node -v`).
- [MongoDB](https://docs.mongodb.com/manual/installation/) version >= 3.6 (which can be checked by running `mongo --version`).

## Quick start

The easiest way to install Commun is to use the `create-commun-app` cli tool. You can run the following commands which will
set up everything you need to get started:

```bash
npx create-commun-app my-app
cd my-app
npm start
```

For advanced configurations check out the help of the tool by running `npx create-commun-app --help`

```bash
$ npx create-commun-app --help
Usage: create-commun-app [options] <app-directory>

Options:
  -V, --version      output the version number
  --dbname <dbname>  MongoDB database name (defaults to <app-directory>)
  --dbhost <dbname>  MongoDB host (default: "localhost")
  --dbport <dbname>  MongoDB port (default: "27017")
  -d, --debug        output extra debugging
  -p, --port <port>  Port used by the server (default: 3000)
  -h, --help         output usage information
```

## Create your first admin account

When you start your server without any admin account, you will get in your terminal a link containing a security token to
create your first admin account. Open the link in your browser and follow the steps. 

## Running Commun
 
### Development 

In order to start a **development** server run: `npm start`. By default your server will run on the port `3000`.

### Production

In order to start a **production** server run: `npm run start:production`. By default your server will run on the port `3000`.

### Manage your Commun app

These are some useful links you can use to manage your application:

- **🚀 Server endpoint**: `http://localhost:<port>`
- **🎩 ‍Admin dashboard**: `http://localhost:<port>/dashboard`
- **💪 API endpoint**: `http://localhost:<port>/api/v1/<entity>`
- **👌 GraphQL endpoint**: `http://localhost:<port>/graphql`
