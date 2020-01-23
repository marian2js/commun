import { EmailModule } from './EmailModule'
import { Commun } from '@commun/core'

type TemplateVariables = {
  [key: string]: any
}

export const EmailClient = {
  sendEmail (templateName: string, to: string, templateVariables: TemplateVariables = {}) {
    if (!EmailModule.wasSetup) {
      return
    }
    const { sendFrom, transporter } = EmailModule.getOptions()
    const templates = EmailModule.getTemplates()
    const template = templates[templateName]
    if (!template || !template.enabled) {
      return
    }

    if (!transporter) {
      console.warn('Skipping email send, transporter not set')
      return
    }

    const communOptions = Commun.getOptions()

    const templateVars = {
      ...communOptions,
      ...templateVariables,
    }

    return transporter.sendMail({
      from: template.sendFrom || sendFrom,
      to,
      subject: parseTemplateVariables(template.subject, templateVars),
      text: parseTemplateVariables(template.text, templateVars),
    })
  },
}

function parseTemplateVariables (template: string, variables: TemplateVariables) {
  for (const [key, value] of Object.entries(variables)) {
    const regexp = RegExp(`{\s*${key}\s*}`, 'g')
    template = template.replace(regexp, (value || '').toString())
  }
  return template
}
