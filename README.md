# Commun

With Commun you can build complete backends for communities and user based apps **without coding**.

Commun helps you build scalable APIs in hours instead of months by giving you powerful tools to model your app in a graphic UI.   

## Key Features

- Supports **GraphQL** and **REST API** out of the box
- Secure authentication with email and password or third party systems (Google, Facebook and GitHub)
- Fully-featured user and permissions management
- Fast full-text search
- UI Dashboard for managing the entire application without coding
- Create the entities and custom attributes that your app needs
- Use hooks for performing operations in response of lifecycle events 

## Installation

#### Quick start

You need to install [Node.js](https://nodejs.org/en/download/) and [MongoDB](https://docs.mongodb.com/manual/installation/) first, then just run:

```
npx create-commun-app my-app
cd my-app
npm start
```

#### create-commun-app options

```
npx create-commun-app --help
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

## Features

### User Management

Commun includes a fully featured user system with authentication and permission management.

Supported authentication strategies include: Email & Password, Google, Facebook and GitHub.

**Provided APIs:**

* `[POST] /api/v1/auth/password`
  - Creates a new user with email, username and password
  - Sends an email with a code to verify the email 

* `[POST] /api/v1/auth/password/login`
  - Authenticates an user with email/username and password
  - Returns refresh and access token

* `[POST] /api/v1/auth/token`
  - Returns an access token given a refresh token

* `[POST] /api/v1/auth/verify`
  - Verifies an user's email given the code sent after registration

* `[POST] /api/v1/auth/password/forgot`
  - Sends a forgot password code by email

* `[POST] /api/v1/auth/password/reset`
  - Allows to change a password, given a valid forgot password code

Users are entities, so you can also use all the APIs specified bellow, where `:entity` is `users`

### Entities

Entities represent the components of your application, for example: Posts, Comments, Votes.

**Provided APIs:**

* `[GET] /api/v1/:entity`
  - Returns a paginated list of items in the entity, where :entity is the name of your entity
  - Use `?sort=attr:asc` query string to sort the items given an attribute.
  - Use `?filter=attr1:bar;attr2:foo` query string to filter the items given attributes and values
  - It only returns items to users with the right GET permission
  - For each item, it only returns the attributes with the user has the right GET permission

* `[POST] /api/v1/:entity`
  - Creates a new item sending the attributes in the body
  - The user needs to have the right CREATE permission
  - Only attributes with the right CREATE permission are set

* `[GET] /api/v1/:entity/:key`
  - Returns a single item given its ID or the attribute used to identify the entity.
  - It only returns the item if the user has the right GET permission
  - It only returns the attributes allowed by the GET permission
 
* `[PUT] /api/v1/:entity/:key`
  - Updates a single item with the attributes in the request body
  - The user needs to have the right UPDATE permission
  - Only attributes with the right UPDATE permission are updated

* `[DELETE] /api/v1/:entity/:key`
  - Deletes a single item
  - The user needs to have the right DELETE permission

#### Entity Permissions

You can specify entity or attribute level permissions. Commun supports GET, CREATE, UPDATE and DELETE permissions.

For every permission type you can specify the following values:
- **Anyone**: There are no restrictions on the action.
- **Any authenticated user**: Any user that is authenticated in your application can perform the action.
- **The same user**: Only supported by entities that have an attribute with type `user`, which stores an user ID. Only the authenticated user with the same ID can perform the action.
- **Administrators**: Only users marked as administrators can perform the action.
- **Only the system**: Only the system can perform the action.

#### Entity Attributes

Entities have a list of attributes that represent the different values your component can store.

Attributes can have the following types:
- Boolean: Value can only be true or false.
- Email: Value can only be a valid email address.
- Enum: Value can only be in a specified list of accepted values. 
- Number: Value can only be a number.
- Entity Reference: Value can only be an ID referencing a different entity.
- Slug: Transforms the value of a different attribute to a url friendly value.
- String: Value can only be a string.
- User: Value can only be an user ID.

You can also specify whether the values are required, unique or read only.

#### Entity Join Attributes

Entities can have a list of join attributes, which are attributes fetched from another entity.

An use case of Join Attributes is to return for every item if the logged user likes it or not.

#### Entity Hooks

Entity hooks allow you to increment or set values on an item when certain event happens.

Supported lifecycle events:
- Before Get
- After Get
- Before Create
- After Create
- Before Update
- After Update
- Before Delete
- After Delete

Hooks also allow to specify a condition that must be true in order to execute.

For example, a `PostVote` entity which stores a vote of an user on a given post (1 or -1), hooks can be created to keep the number of up votes and down votes on the post.

#### Entity Indexes

Entities can specify a list of indexes that will be created on MongoDB.

### Dashboard

![Commun Dashboard](https://i.imgur.com/CgHlnVk.png)

Commun comes with a complete dashboard that you can use to manage your application without having to write any code.

The dashboard also works perfectly on mobile devices, so you can manage your app on the go.

### Production readiness

All the configuration used by Commun is stored in json files, which are updated by the dashboard.

The best practice is to run Commun in development, make all the required changes and then commit these changes to your repository.
In order to deploy, just pull the changes in your production server and restart the node process.

The benefits of this practice are: 
* It's easier to test changes in development before moving them to production.
* It's easier to collaborate between team members. You can submit pull requests with your changes and follow the approval process that better fits your organization.
* It's easier to setup a continuous integration system.
