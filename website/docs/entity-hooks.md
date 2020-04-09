---
id: entity-hooks
title: Entity Hooks
sidebar_label: Entity Hooks
---

Entity hooks allow you to increment or set values on an item as response to lifecycle events.

### Lifecycle events

- **Before Get**
- **After Get**
- **Before Create**
- **After Create**
- **Before Update**
- **After Update**
- **Before Delete**
- **After Delete**

### Action

- **Increment**: Increments the value of a target attribute in a given amount.
- **Set**: Sets the value of a target attribute.

### Target

The target attribute is the attribute on which the action will be performed.
This can be an attribute from the same entity, the authenticated user or any referenced entity.

### Value to Increment or Set

This is the value that will be incremented or set in the item's attribute, according to the specified action.
This value can be a constant or an expression.
Constants can be any string, number or boolean, depending on the target attribute type.
Expressions are calculated when the hook is being executed.

### Expressions

Expressions are enclosed within `{ }` and can contain math expressions and reference to values in the same or a
different entity. Values on the same entity can be referenced with the keyword `this`, for instance `{this.numberOfComments}`.
Attributes from the authenticated user can be referenced with the keyword `user`, for instance `{user.points}`.

Examples of supported expressions:

- {3 + 5}
- {this.karma * 2}
- {user.points - this.points}
- {this.post.points / 2}
- {5 ^ 2 - this.num}
- {this.num * (2 - this.num)}
- {-this.value}
