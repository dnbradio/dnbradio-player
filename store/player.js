export const state = () => ({
    starOn: true
})

export const getters = {
    getStarStatue(state) {
        return state.starOn
    }
}

export const mutations = {
    SET_STAR_ON: (state, payload) => {
        state.starOn = payload
    }
}

export const actions = {
    async setStarState ({commit, state}, payload) {
        commit('SET_STAR_ON', payload)
    }
}