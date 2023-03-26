import { Model } from '@vuex-orm/core'
export default class Station extends Model {
  static entity = 'stations'

  static fields () {
    return {
      id: this.uid(),
      pathname: this.string(''),
      name: this.string(''),
      title: this.string(''),
      subtitle: this.string(''),
      description: this.string(''),
      nowplaying_url: this.attr(''),
      schedule: this.attr(''),
      podcast:this.attr(''),
      streams: this.attr(''),
      cover: this.attr(''),
      website: this.attr(''),
      facebook: this.attr(''),
      twitter: this.attr(''),
      twitterId: this.attr(''),
      instagram: this.attr(''),
      soundcloud: this.attr(''),
      tags: this.attr(''),
    }
  }
}