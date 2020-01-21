import React, { useState } from 'react'
import { EmailTemplate } from '@commun/emails'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup, FormHelperText,
  Grid,
  makeStyles,
  TextareaAutosize,
  TextField
} from '@material-ui/core'
import { handleAttrChange } from '../../utils/attributes'

const useStyles = makeStyles(theme => ({
  emailText: {
    width: '100%',
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
  },
}))

interface Props {
  template?: EmailTemplate
  templateKey?: string
  onChange: (key: keyof EmailTemplate, value: any) => void
  onKeyChange: (templateKey: string) => void
}

export const EmailTemplateForm = (props: Props) => {
  const classes = useStyles()
  const { template, onChange, onKeyChange } = props
  const [templateKey, setTemplateKey] = useState(props.templateKey)
  const [enabled, setEnabled] = useState(template ? template.enabled : true)
  const [subject, setSubject] = useState(template?.subject)
  const [text, setText] = useState(template?.text)

  const isNew = !template

  const handleTemplateKeyChange = (key: string) => {
    setTemplateKey(key)
    onKeyChange(key)
  }

  return (
    <Grid container>
      <Grid item xs={12}>
        <TextField
          onChange={e => handleTemplateKeyChange(e.target.value as string)}
          value={templateKey}
          name="templateKey"
          variant="outlined"
          margin="normal"
          fullWidth
          disabled={!isNew}
          required
          label="Template Key"/>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={enabled}
                          onChange={() => handleAttrChange(onChange, 'enabled', !enabled, setEnabled)}/>
              }
              label="Enabled"/>
          </FormGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          onChange={e => handleAttrChange(onChange, 'subject', (e.target.value as string), setSubject)}
          value={subject}
          name="subject"
          variant="outlined"
          margin="normal"
          fullWidth
          required
          label="Subject"
          helperText={'Supports variables between curly braces (e.g. {username})'}/>
      </Grid>

      <Grid item xs={12}>
        <TextareaAutosize className={classes.emailText}
                          onChange={e => handleAttrChange(onChange, 'text', (e.target.value as string), setText)}
                          value={text}
                          name="text"
                          rowsMin={6}
                          placeholder="Email text *"
                          required/>
        <FormHelperText>{'Supports variables between curly braces (e.g. {username})'}</FormHelperText>
      </Grid>
    </Grid>
  )
}
