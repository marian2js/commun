---
id: entity-permissions
title: Entity Permissions
sidebar_label: Entity Permissions
---

Entity permissions allow to specify which users can perform actions on a given item.
Item actions include: `Get`, `Create`, `Update` and `Delete`.
For each one of these actions one of the following permissions can be specified:
 
### Anyone
  - The action won't have any validation. Anyone can perform it, including non-authenticated users.
  - Stored in configuration as `anyone`.
 
### Any authenticated user
  - The action can be performed only by authenticated users. 
  - Stored in configuration as `user`.
 
### The user who owns the resource
  - The action can be performed only by the user that owns the given item.
  The action is only allowed if the ID of the authenticated user matches the value of the attribute with type `user`.
  - Usually, update and delete actions on entities with user created items use this permission, in order to ensure that
  only the user that created the resource can update or delete it.
  - By default, administrators can perform this action on any item.  
  - Stored in configuration as `own`.
 
### Administrators
  - The action can be performed only by admin users.
  - Stored in configuration as `admin`.
 
### Only the system
  - The action cannot be performed by any user. The system can still perform this action, for instance, as response to a predefined hook.
  - Stored in configuration as `system`.
