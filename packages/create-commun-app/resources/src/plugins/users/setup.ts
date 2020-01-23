import { UserModule } from '@commun/users'

export default async function () {
  await UserModule.setup(require('./config.json'))
}
