---
id: entity-join-attributes
title: Entity Join Attributes
sidebar_label: Entity Join Attributes
---

Entities can have a list of join attributes, which are useful for querying related items from any entity.

## Query Type

- **Find One**: The attribute value will be a single item queried from a specific entity.
- **Find Many**: The attribute value will be a list of items queried from a specific entity.

## Query

A query is composed by a set of key-value conditions, where the keys are attributes from the selected entity.
The result of the query will be the item or items that match all the conditions. Each value can be static or dynamic.

### Static query values

Static values can be any string, number or boolean. The given value will be queried in the Entity Reference and only
items matching the exact value will conform to the condition.

### Dynamic query values

Dynamic values can be used to query items based on information from the current item or the authenticated user.
These values are enclosed within `{ }`. The keyword `this` can be used to access data from the current item,
for example `{this.id}` will query for the ID of the current item. 
The keyword `user` can be used to access data from the authenticated user, for example `{user.id}`  will query for the
value of the ID of the authenticated user.

## Example

Let's assume two entities: **Posts** and **Likes**. The requirement is to return whether the authenticated user liked or
not a given post. **Likes** has two attributes: **post** and **user** which contain the IDs of the liked post and the
user who liked the post respectively.

In order to solve this, we can create a join attribute on **Posts** called **viewerLike** which will query the
required data. The join attribute settings will be:

![Join Attribute Example](/img/docs-entity-join-attributes-1.png)

When fetching a post with the access token of an user who liked it, the post will include in the response a
**viewerLike** attribute, which will contain the queried item from the Likes entity. 
