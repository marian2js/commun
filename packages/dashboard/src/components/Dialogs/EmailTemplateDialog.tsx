import React, { useEffect, useState } from 'react'
import { useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import { EmailTemplate } from '@commun/emails'
import { EmailTemplateForm } from '../Forms/EmailTemplateForm'
import { PluginService } from '../../services/PluginService'

interface Props {
  template?: EmailTemplate
  templateKey?: string
  open: boolean
  onChange: (templateKey: string, template: EmailTemplate) => void
  onCancel: () => void
}

export const EmailTemplateDialog = (props: Props) => {
  const theme = useTheme()
  const { template, open, onChange, onCancel } = props
  const [templateData, setTemplateData] = useState<Partial<EmailTemplate>>(template || {})
  const [templateKey, setTemplateKey] = useState(props.templateKey)

  useEffect(() => {
    setTemplateData(template || {})
    setTemplateKey(props.templateKey)
  }, [template, props.templateKey])

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const templateIsNew = !template

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!templateKey) {
      return
    }
    const template = {
      enabled: true,
      ...(templateData as EmailTemplate),
    }
    await PluginService.createEmailTemplate(templateKey, template)
    onChange(templateKey, template)
  }

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await PluginService.updateEmailTemplate(templateKey!, templateData as EmailTemplate)
    onChange(templateKey!, template as EmailTemplate)
  }

  const handleTemplateChange = (key: keyof EmailTemplate, value: any) => {
    setTemplateData({
      ...(templateData || {}),
      [key]: value,
    })
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="email-template-dialog-title">

      <DialogTitle id="email-template-dialog-title">
        {templateIsNew ? 'Add new template' : `Update "${templateKey}"`}
      </DialogTitle>

      <DialogContent>
        <EmailTemplateForm template={template}
                           templateKey={templateKey}
                           onChange={handleTemplateChange}
                           onKeyChange={setTemplateKey}/>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} color="primary">
          Cancel
        </Button>
        {
          templateIsNew ?
            <Button onClick={handleAddClick} color="primary" autoFocus>
              Add template
            </Button> :
            <Button onClick={handleUpdateClick} color="primary" autoFocus>
              Update
            </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
