import React, { useEffect } from 'react'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import DynamicFeedIcon from '@material-ui/icons/DynamicFeed'
import ListItemText from '@material-ui/core/ListItemText'
import { ExpandLess, ExpandMore } from '@material-ui/icons'
import { CircularProgress, Collapse } from '@material-ui/core'
import List from '@material-ui/core/List'
import PeopleIcon from '@material-ui/icons/People'
import CodeIcon from '@material-ui/icons/Code'
import AddIcon from '@material-ui/icons/Add'
import { EntityService } from '../../services/EntityService'
import { EntityConfig, EntityModel } from '@commun/core'
import capitalize from '@material-ui/core/utils/capitalize'
import { Link } from 'react-router-dom'
import { useParams, useLocation } from 'react-router'

export function EntitiesDropdown () {
  const [open, setOpen] = React.useState(true)
  const [entities, setEntities] = React.useState<EntityConfig<EntityModel>[]>([])
  const params = useParams<{ [key: string]: string }>()
  const location = useLocation()

  useEffect(() => {
    (async () => {
      const res = await EntityService.getEntities()
      setEntities(res.items)
    })()
  }, [])

  if (!entities.length) {
    return <CircularProgress/>
  }

  return (
    <>
      <ListItem button onClick={() => setOpen(!open)}>
        <ListItemIcon>
          <DynamicFeedIcon/>
        </ListItemIcon>
        <ListItemText primary="Entities"/>
        {open ? <ExpandLess/> : <ExpandMore/>}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {
            entities.map(entity => (
              <ListItem key={entity.entityName}
                        selected={params.entityName === entity.entityName}
                        button
                        component={Link}
                        to={`/entities/${entity.entityName}`}>
                <ListItemIcon>
                  {entity.entityName === 'users' ? <PeopleIcon/> : <CodeIcon/>}
                </ListItemIcon>
                <ListItemText primary={capitalize(entity.entityName)}/>
              </ListItem>
            ))
          }
          <ListItem button component={Link} to="/add-entity" selected={location.pathname === '/add-entity'}>
            <ListItemIcon><AddIcon/></ListItemIcon>
            <ListItemText primary="Add entity"/>
          </ListItem>
        </List>
      </Collapse>
    </>
  )
}
