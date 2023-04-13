export const state = () => ({
    visualsEnabled: false,
    initialLoad: true,
})


export const mutations = {
  TOGGLE_VISUALS: (state, payload) => {
    state.visualsEnabled = !state.visualsEnabled
  },
  SET_INITIAL_LOAD: (state, payload) => {
    state.initialLoad = payload;
  }
}

export const actions = {
    async TOGGLE_VISUALS ({commit}, payload) {
        commit('TOGGLE_VISUALS', payload)
    },
    SET_INITIAL_LOAD ({commit}, payload) {
      commit('SET_INITIAL_LOAD', payload);
    }
}