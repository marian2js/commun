---
id: entities
title: Entities
sidebar_label: Creating Entities
---

Entities represent the components of your application, for example: Posts, Comments and Votes.
Each entity can contain any number of items.
These items can only contain values for the attributes defined on the entity and must respect its constraints.

Entities can be created from the dashboard, by using the `Add Entity` option on the side menu.

Entities must be named camelCase and the name must be plural.
Examples of good entity names are: `posts`, `comments` and `postVotes`.

When creating and entity you must specify if users can create items on the entity.
Checking this option will setup some useful configuration on the entity.
For instance, in your application, users might be allowed to create comments, but not categories. 
