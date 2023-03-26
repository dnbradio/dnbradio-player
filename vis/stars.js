export default async function renderVis () {
if (window.animId) {
  cancelAnimationFrame(window.animId)
}
window.animId = null
// HELPER FUNCTIONS
function randInt(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function randFloat(min, max) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(2));
}

function randXPos(canvas, radius) {
  return randInt(0 + radius, canvas.width - radius);
}

function randYPos(canvas, radius) {
  return randInt(0 + radius, canvas.height - radius);
}

// CANVAS INITIALIZATION
const canvasContainer = document.querySelector(".viscanvas-container");
const canvas = document.querySelector("#viscanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
function setCanvasSize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

setCanvasSize(); // Resize canvas on page load
window.addEventListener("resize", setCanvasSize); // Resize canvas on window resize

// Fill canvas background initially
ctx.fillStyle = "rgba(20,20,20,1)";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// ESTABLISH VARIABLES
const backgroundFillRate = 0.6;
const particleCount = 40;
const particleSizeRange = [0.5, 2];
const particleOpacityRange = [0.1, 0.7];
const particleVelocityRange = [1, 5];
const particles = [];

// PARTICLE INITIALIZATION
for(let i = 0; i < particleCount; i++) {
  const newParticle = {
    radius: randFloat(particleSizeRange[0], particleSizeRange[1]),
    opacity: randFloat(particleOpacityRange[0], particleOpacityRange[1]),
    velocity: randInt(particleVelocityRange[0], particleVelocityRange[1])
  };
  
  newParticle.x = randXPos(canvas, newParticle.radius);
  newParticle.y = randYPos(canvas, newParticle.radius);
  //newParticle.velocity = newParticle.opacity * 30;
  
  particles.push(newParticle);
}


// UPDATE
function update() {
  
  // Update the particles
  for(let i = 0; i < particles.length; i++) {
    const p = particles[i];
    
    p.x -= p.velocity;
    
    if(p.x >= (canvas.width + p.radius)) {
      p.x = 0 - p.radius;
    } else if(p.x <= (0 - p.radius)) {
      p.x = canvas.width + p.radius;
    }
  }
}

// DRAW
function draw() {
  
  // Fill canvas background
  // ctx.shadowBlur = 0;
  // ctx.shadowColor = 'rgba(255, 255, 225, 0)';
  ctx.fillStyle = `rgba(20,20,20,${backgroundFillRate})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw the particles
  for(let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.beginPath();
    
    ctx.strokeStyle = `rgba(255,255,255,${p.opacity})`;
    ctx.lineWidth = p.radius * 2;
    
    // ctx.shadowBlur = 4;
    // ctx.shadowColor = "#ffffff";
    
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (p.radius * 4), p.y);
    ctx.stroke();
    
    // ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
    // ctx.arc(p.x, p.y, p.radius, 0, 2*Math.PI);
    // ctx.fill();
  }
}

// Run the animation
function run() {
  update();
  draw();
  window.animId = requestAnimationFrame(run);
}

window.animId = requestAnimationFrame(run);
}