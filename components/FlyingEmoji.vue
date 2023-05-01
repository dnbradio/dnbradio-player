<template>
  <div class="flying-emoji-cont"></div>
</template>

<script>
export default {
  methods: {
    push(emoji) {
      let el = document.querySelector('.flying-emoji-cont');
      let child = el.appendChild(document.createElement('span'));
      child.className = `em-node-${(Math.floor(Math.random() * 5) + 1)}`;
      child.innerHTML = `${emoji}`;
    }
  }
}
</script>

<style>

.flying-emoji-outer-placement { 
  text-align: right;
  position: absolute;
  bottom: 20px;
  margin-left: 550px;
  border-bottom: 3px;
  z-index: 100;
  width: 265px;
  height: 471px;
}

.flying-emoji-cont {
  font-size: 1.8em;
}

.flying-emoji-cont .em-container {
    width: 300px;
    border: solid 1px #ccc;
    height: 300px;
    position: relative;
}

.flying-emoji-cont .em-node-1 {
    width: 24px;
    height: 24px;
    position: absolute;
    bottom: 0;
    right: 0;
    opacity: 0;
    animation: 3s animation1 linear 1;
}

.flying-emoji-cont .em-node-2 {
    width: 24px;
    height: 24px;
    position: absolute;
    bottom: 0;
    right: 0;
    opacity: 0;
    animation: 4s animation2 ease-in-out 1;
}

.flying-emoji-cont .em-node-3 {
    width: 24px;
    height: 24px;
    position: absolute;
    bottom: 0;
    right: 0;
    opacity: 0;
    animation: 2s animation3 ease-in 1;
}

.flying-emoji-cont .em-node-4 {
    width: 24px;
    height: 24px;
    position: absolute;
    bottom: 0;
    right: 0;
    opacity: 0;
    animation: 4s animation4 ease-out 1;
}

.flying-emoji-cont .em-node-5 {
    width: 24px;
    height: 24px;
    position: absolute;
    bottom: 0;
    right: 0;
    opacity: 0;
    animation: 2s animation5 cubic-bezier(0.55, 0.09, 0.68, 0.53) 1;
}

@keyframes animation1 {
    0% {
        top: 380px;
        opacity: 1;
        transform: scale(0);
    }
    5% {
        transform: scale(0.5);
    }
    50% {
        right: 80px;
    }
    80% {
        opacity: 1;
    }
    100% {
        top: 0px;
        opacity: 0;
        right: 30px;
        transform: scale(1);
    }
}

@keyframes animation2 {
    0% {
        top: 380px;
        right: 3px;
        opacity: 1;
        transform: scale(0);
    }
    5% {
        transform: scale(0.5);
    }
    50% {
        right: 115px;
    }
    80% {
        opacity: 1;
    }
    100% {
        top: 0px;
        opacity: 0;
        right: 130px;
        transform: scale(1);
    }
}

@keyframes animation3 {
    0% {
        top: 370px;
        opacity: 1;
        transform: scale(0);
    }
    5% {
        transform: scale(0.5);
    }
    50% {
        right: 35px;
    }
    80% {
        opacity: 1;

    }
    100% {
        top: 0px;
        opacity: 0.1;
        right: 140px;
        transform: scale(2.2);
    }
}

@keyframes animation4 {
    0% {
        top: 380px;
        opacity: 1;
        transform: scale(0);
    }
    5% {
        transform: scale(0.5);
    }
    50% {
        right: 65px;
    }
    80% {
        opacity: 1;
    }
    100% {
        top: 0px;
        opacity: 0;
        right: 40px;
        transform: scale(3.5);
    }
}


@keyframes animation5 {
    0% {
        top: 380px;
        right: 4px;
        opacity: 1;
        transform: scale(0);
    }
    5% {
        transform: scale(0.5);
    }
    80% {
        opacity: 1;
    }
    100% {
        top: 0px;
        opacity: 0;
        transform: scale(0.8);
    }
}
</style>