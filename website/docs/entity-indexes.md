---
id: entity-indexes
title: Entity Indexes
sidebar_label: Entity Indexes
---

Entities can have a list of indexes that will be created on MongoDB.
Indexes can be used to make operations respond faster and more efficiently,
to ensure uniqueness of one or more attributes and to support full-text searches.
Indexes can contain one or more attributes.

### Unique indexes

Unique indexes ensure that there won't be two indexes with duplicated values for the selected attributes.
If more than one value has been selected for the index, the constraint will enforce uniqueness on the combination of
those values.

### Sparse indexes

Sparse indexes constraints will only be applied for items containing a value for the selected attributes.
These indexes are useful when ensuring uniqueness of non-required attributes.

### Full-text search

Text indexes enable the use of full-text search APIs. Only one text index can exist per entity, but it can contain
multiple attributes.
