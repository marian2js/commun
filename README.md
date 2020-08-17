# 🎩 Commun

Commun is a fully-featured framework for building REST APIs and GraphQL servers from a set of [JSON Schemas](https://json-schema.org/)
and configurations, which can be written by hand or using our [UI dashboard](#dashboard).

Who said your team needs to write code for building CRUD APIs, authentication and authorization?

**[Documentation](https://commun.dev/docs/introduction)**.

## Installation

You need to install [Node.js](https://nodejs.org/en/download/) and [MongoDB](https://docs.mongodb.com/manual/installation/) first, then just run:

```
npx create-commun-app my-app
cd my-app
npm start
```

## Features

### 🚀 GraphQL and REST API support
- Commun automatically prepares a GraphQL and Rest API backend which you can consume from anywhere.
- Use your Commun backend to provide your entire frontend or use it to extend your existing application.
 
### 🔑 Secure authentication & role based permission management
- Commun provides secure authentication and role based permission management out of the box.
- Your users can create accounts using email and password or third party systems like Google, Facebook or GitHub.
 
### 🤩 Lifecycle Hooks
- Hooks allow you to perform actions as responses to lifecycle events on any item.
 
### 🔎 Fast full-text search
- Text indexes allow you to create full-text search APIs.
- They can run on one or more attributes.
- Not all attributes are equally important. You can optionally set weights on each one to provide better search results.
   
### 🎚 UI Dashboard
- Manage your entire application without coding using the mobile-friendly dashboard.
  
### 📧 Emails
- Send emails to your users in response to events.
- Create templates with custom variables to personalize the experience of your users.
- Welcome email, email verification and password change verification come by default.  

### 🔌 Pluggable
- Commun was built as a set of optional plugins that can be easily integrated.
- Features like users, dashboard, emails and GraphQL are just plugins.
All these features live in different npm packages and can be installed/uninstalled as needed.

## Use Cases

Commun can be used to create any kind of application, but it can be extra helpful for creating applications in which the
users can create content or any kind of contributions.

Some examples include:

- Content sharing platforms
- Forums or discussion boards
- Social networks
- Job boards
- Property listing platforms
- Reviews sharing platforms
- Events listing platforms

## Dashboard

![Commun Dashboard](https://i.imgur.com/OfssVs1.png)

Commun comes with a complete dashboard that you can use to manage your application without having to write any code.

The dashboard also works perfectly on mobile devices, so you can manage your app on the go.

## Production readiness

All the configuration used by Commun is stored in json files, which are updated by the dashboard.

The best practice is to run Commun in development, make all the required changes and then commit these changes to your repository.
In order to deploy, just pull the changes in your production server and restart the node process.

The benefits of this practice are: 
* It's easier to test changes in development before moving them to production.
* It's easier to collaborate between team members. You can submit pull requests with your changes and follow the approval process that better fits your organization.
* It's easier to setup a continuous integration system.
