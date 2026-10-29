import { createStore } from "vuex";
import * as player from "./player.js";
export default createStore({
  modules: { player: { ...player, namespaced: true } },
});
