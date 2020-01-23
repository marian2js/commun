import { Commun } from '@commun/core'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

Commun.startServer(__dirname)
