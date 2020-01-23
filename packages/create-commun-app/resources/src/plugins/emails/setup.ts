import { EmailModule } from '@commun/emails'

export default async function () {
  await EmailModule.setup(require('./config.json'))
}
