---
id: graphql
title: GraphQL
sidebar_label: GraphQL
---

Commun provides a set of GraphQL queries and mutations for each entity and for managing the authenticated user.

## Authentication

In order to authenticate a query or mutation, a valid access token is needed.
The access token can be obtained with the `login` mutation or the `accessToken` query.

Add a header field to the GraphQL request with key `Authorization` and value `Bearer <accessToken>`.

## GraphiQL

You can access GraphiQL on the dashboard by going to the GraphQL plugin.
The GraphQL explorer already has the credentials from the user authenticated in the dashboard.
A documentation is also available on the explorer.  

## Auto-generated schema

Every time the schema changes, the file `schema.graphql` on the root of the project is updated.
This file can be used to enable IDE support for the schema of your application. 
