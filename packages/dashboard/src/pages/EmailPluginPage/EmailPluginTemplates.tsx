import React, { useEffect, useState } from 'react'
import { EmailConfig, EmailTemplate } from '@commun/emails'
import { SelectTable } from '../../components/Table/SelectTable'
import { EmailTemplateDialog } from '../../components/Dialogs/EmailTemplateDialog'
import { PluginService } from '../../services/PluginService'

interface Props {
  plugin: EmailConfig
}

export const EmailPluginTemplates = (props: Props) => {
  const [templates, setTemplates] = useState<{ [key: string]: EmailTemplate }>({})
  const [selected, setSelected] = useState<string | undefined>()
  const [templateDialogOpen, setTemplateDialogOpen] = useState<boolean>(false)

  useEffect(() => {
    setTemplates(props.plugin.templates || {})
  }, [props.plugin])

  const handleAddClicked = () => {
    setTemplateDialogOpen(true)
  }

  const handleUpdateClicked = () => {
    setTemplateDialogOpen(true)
  }

  const handleDeleteClicked = async () => {
    if (selected) {
      await PluginService.deleteEmailTemplate(selected)
      delete templates[selected]
      setTemplates(templates)
    }
    setSelected('')
  }

  const handleTemplatesChange = (templateKey: string, template: EmailTemplate) => {
    setTemplates({
      ...templates,
      [templateKey]: template,
    })
    setTemplateDialogOpen(false)
  }

  const tableHeaderKeys = [{
    key: 'key',
    label: 'Key'
  }, {
    key: 'enabled',
    label: 'Enabled'
  }]

  const tableAttributes = Object.entries(templates).map(([key, template]) => ({
    key,
    enabled: template.enabled ? 'Yes' : 'No'
  }))

  return (
    <>
      <EmailTemplateDialog
        template={selected ? templates[selected] : undefined}
        templateKey={selected}
        open={templateDialogOpen}
        onChange={handleTemplatesChange}
        onCancel={() => setTemplateDialogOpen(false)}/>

      <SelectTable headerKeys={tableHeaderKeys}
                   items={tableAttributes}
                   addButtonLabel="Add Email Template"
                   onSelectChange={item => setSelected(item?.key as string | undefined)}
                   onAddClick={handleAddClicked}
                   onUpdateClick={handleUpdateClicked}
                   onDeleteClick={handleDeleteClicked}
      />
    </>
  )
}
