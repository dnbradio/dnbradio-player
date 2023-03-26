import { Database } from '@vuex-orm/core'
import axios from 'axios'
import VuexORM from '@vuex-orm/core'
import VuexORMisDirtyPlugin from '@vuex-orm/plugin-change-flags';
import VuexORMAxios from '@vuex-orm/plugin-axios'

import Autocomplete from '@/models/Autocomplete'
import Station from '@/models/Station'

VuexORM.use(VuexORMAxios, { axios })
VuexORM.use(VuexORMisDirtyPlugin);

const database = new VuexORM.Database()

database.register(Autocomplete)
database.register(Station)

export default database

