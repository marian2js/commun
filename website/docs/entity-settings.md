---
id: entity-settings
title: Entity Settings
sidebar_label: Entity Settings
---

### Collection Name

Collection name is the name used by the MongoDB collection for storing the entity's items.
Updating this value will create a new collection, but it won't migrate existent items.
We recommend only changing this value if the collection is empty.

### Attribute used by API endpoints

The selected attribute will be used to identify items on the entity, by both the Rest API and GraphQL:

On the **Rest API** items can be fetched by using: `[GET] /api/v1/<entityName>/<key>`.
Where `key` is the selected attribute. By default, the MongoDB ID is used.

On **GraphQL** items can be fetched by querying: `<entityName>(<key>: "value") { ... }`.
Where `key` is the selected attribute. By default, the MongoDB ID is used.
