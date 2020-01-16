import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { EntityService } from '../../services/EntityService'
import { EntityConfig, EntityModel } from '@commun/core'
import {
  CircularProgress,
  Container,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  makeStyles,
  Typography
} from '@material-ui/core'
import { Layout } from '../../components/Layout/Layout'
import { EntitySettings } from './EntitySettings'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

const useStyles = makeStyles(theme => ({
  container: {},
  permissions: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },

  expansionPanelHeading: {
    fontSize: theme.typography.pxToRem(18),
    flexShrink: 0,
  },
}))

export const EntityPage = () => {
  const classes = useStyles()
  let { entityName } = useParams()
  const [entity, setEntity] = useState<EntityConfig<EntityModel>>()
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({ settings: true })

  useEffect(() => {
    (async () => {
      const res = await EntityService.getEntity(entityName!)
      setEntity(res.item)
    })()
  }, [entityName])

  const handleExpansion = (panelKey: string) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
    setExpanded({ ...expanded, [panelKey]: !expanded[panelKey] })
  }

  if (!entity) {
    return <CircularProgress/>
  }

  return (
    <Layout>
      <Container maxWidth="lg" className={classes.container}>

        <ExpansionPanel expanded={expanded.settings}
                        onChange={handleExpansion('settings')}
                        TransitionProps={{ unmountOnExit: true }}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon/>}
            aria-controls="settings-content"
            id="settings-header">
            <Typography className={classes.expansionPanelHeading}>General settings</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <EntitySettings entity={entity}/>
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <ExpansionPanel expanded={expanded.permissions}
                        onChange={handleExpansion('permissions')}
                        TransitionProps={{ unmountOnExit: true }}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon/>}
            aria-controls="permissions-content"
            id="permissions-header">
            <Typography className={classes.expansionPanelHeading}>Permissions</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            Not implemented yet!
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <ExpansionPanel expanded={expanded.attributes}
                        onChange={handleExpansion('attributes')}
                        TransitionProps={{ unmountOnExit: true }}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon/>}
            aria-controls="attributes-content"
            id="attributes-header">
            <Typography className={classes.expansionPanelHeading}>Attributes</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            Not implemented yet!
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <ExpansionPanel expanded={expanded.joinAttributes}
                        onChange={handleExpansion('joinAttributes')}
                        TransitionProps={{ unmountOnExit: true }}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon/>}
            aria-controls="joinAttributes-content"
            id="joinAttributes-header">
            <Typography className={classes.expansionPanelHeading}>Join Attributes</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            Not implemented yet!
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <ExpansionPanel expanded={expanded.hooks}
                        onChange={handleExpansion('hooks')}
                        TransitionProps={{ unmountOnExit: true }}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon/>}
            aria-controls="hooks-content"
            id="hooks-header">
            <Typography className={classes.expansionPanelHeading}>Hooks</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            Not implemented yet!
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <ExpansionPanel expanded={expanded.indexes}
                        onChange={handleExpansion('indexes')}
                        TransitionProps={{ unmountOnExit: true }}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon/>}
            aria-controls="indexes-content"
            id="indexes-header">
            <Typography className={classes.expansionPanelHeading}>Indexes</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            Not implemented yet!
          </ExpansionPanelDetails>
        </ExpansionPanel>

      </Container>
    </Layout>
  )
}
