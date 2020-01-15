import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { EntityService } from '../../services/EntityService'
import { EntityConfig, EntityModel } from '@commun/core'
import { CircularProgress } from '@material-ui/core'
import { Layout } from '../../components/Layout/Layout'

export const EntityPage = () => {
  let { entityName } = useParams()
  const [entity, setEntity] = useState<EntityConfig<EntityModel>>()

  useEffect(() => {
    (async () => {
      const res = await EntityService.getEntity(entityName!)
      setEntity(res.item)
    })()
  }, [entityName])

  if (!entity) {
    return <CircularProgress/>
  }

  return (
    <Layout>
      <p>Name: {entity.entityName}</p>
      <p>Attributes: {Object.keys(entity.attributes).join(', ')}</p>
    </Layout>
  )
}
