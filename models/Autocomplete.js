import { Model } from '@vuex-orm/core'
export default class Autocomplete extends Model {
  static entity = 'autocompletes'

  static fields () {
    return {
      id: this.uid(),
      name: this.string(''),
      tags: this.attr(''),
    }
  }
}