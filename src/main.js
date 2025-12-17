import * as THREE from 'three'

// ==================== THEMES ====================
const THEMES = {
romantic: {
name: 'Romantic',
colors: [0xff6b9d, 0xff8fab, 0xffc2d1, 0xffb3c6, 0xff85a1],
background: 0x0a0512
},
neon: {
name: 'Neon',
colors: [0x00ffff, 0xff00ff, 0x00ff00, 0xffff00, 0xff0080],
background: 0x05050f
},
ocean: {
name: 'Ocean',
colors: [0x0077b6, 0x00b4d8, 0x90e0ef, 0x48cae4, 0xcaf0f8],
background: 0x03071e
},
sunset: {
name: 'Sunset',
colors: [0xff6b35, 0xf7c59f, 0xef8354, 0xffba08, 0xfaa307],
background: 0x10002b
},
forest: {
name: 'Forest',
colors: [0x2d6a4f, 0x40916c, 0x52b788, 0x74c69d, 0x95d5b2],
background: 0x081c15
}
}

const themeNames = Object.keys(THEMES)
let currentThemeIndex = 0

// ==================== PARTICLE SYSTEM ====================
class ParticleSystem {
constructor() {
this.canvas = document.getElementById('canvas')
this.scene = new THREE.Scene()
this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
this.particleCount = /Mobi|Android/i.test(navigator.userAgent) ? 6000 : 12000
this.particles = null
this.geometry = null
this.targetPositions = null
this.originalPositions = null
this.velocities = null
this.currentFormation = null
this.clock = new THREE.Clock()
this.theme = THEMES.romantic

this.init()
}

init() {
this.renderer.setSize(window.innerWidth, window.innerHeight)
this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
this.scene.background = new THREE.Color(this.theme.background)
this.camera.position.z = 5

this.createParticles()
this.animate()

window.addEventListener('resize', () => this.onResize())

// Hide loading
setTimeout(() => {
document.getElementById('loading').classList.add('hidden')
}, 500)
}

createParticles() {
if (this.particles) {
this.scene.remove(this.particles)
this.geometry.dispose()
}

this.geometry = new THREE.BufferGeometry()
const positions = new Float32Array(this.particleCount * 3)
const colors = new Float32Array(this.particleCount * 3)
const sizes = new Float32Array(this.particleCount)

this.targetPositions = new Float32Array(this.particleCount * 3)
this.originalPositions = new Float32Array(this.particleCount * 3)
this.velocities = new Float32Array(this.particleCount * 3)

for (let i = 0; i < this.particleCount; i++) {
const i3 = i * 3

const x = (Math.random() - 0.5) * 10
const y = (Math.random() - 0.5) * 10
const z = (Math.random() - 0.5) * 4

positions[i3] = x
positions[i3 + 1] = y
positions[i3 + 2] = z

this.originalPositions[i3] = x
this.originalPositions[i3 + 1] = y
this.originalPositions[i3 + 2] = z

this.targetPositions[i3] = x
this.targetPositions[i3 + 1] = y
this.targetPositions[i3 + 2] = z

this.velocities[i3] = 0
this.velocities[i3 + 1] = 0
this.velocities[i3 + 2] = 0

const color = new THREE.Color(this.theme.colors[Math.floor(Math.random() * this.theme.colors.length)])
colors[i3] = color.r
colors[i3 + 1] = color.g
colors[i3 + 2] = color.b

sizes[i] = Math.random() * 0.5 + 0.5
}

this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

const material = new THREE.ShaderMaterial({
uniforms: {
uTime: { value: 0 },
uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
},
vertexShader: `
attribute float size;
varying vec3 vColor;
uniform float uTime;
uniform float uPixelRatio;

void main() {
vColor = color;
vec3 pos = position;
pos.y += sin(uTime * 0.5 + position.x * 0.5) * 0.02;
pos.x += cos(uTime * 0.3 + position.y * 0.5) * 0.02;

vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
gl_PointSize = size * uPixelRatio * (250.0 / -mvPosition.z);
gl_Position = projectionMatrix * mvPosition;
}
`,
fragmentShader: `
varying vec3 vColor;

void main() {
float dist = length(gl_PointCoord - vec2(0.5));
if (dist > 0.5) discard;

float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
alpha = pow(alpha, 1.5);

gl_FragColor = vec4(vColor * 1.2, alpha);
}
`,
transparent: true,
vertexColors: true,
blending: THREE.AdditiveBlending,
depthWrite: false
})

this.particles = new THREE.Points(this.geometry, material)
this.scene.add(this.particles)
}

setTheme(theme) {
this.theme = theme
this.scene.background = new THREE.Color(theme.background)

const colors = this.geometry.attributes.color
for (let i = 0; i < this.particleCount; i++) {
const color = new THREE.Color(theme.colors[Math.floor(Math.random() * theme.colors.length)])
colors.setXYZ(i, color.r, color.g, color.b)
}
colors.needsUpdate = true
}

setFormation(type) {
this.currentFormation = type

switch(type) {
case 'heart':
this.formHeart()
break
case 'love':
this.formText('I LOVE YOU')
break
case 'scatter':
this.scatter()
break
case 'gather':
this.gather()
break
default:
this.reset()
}

this.updateGestureDisplay(type)
}

updateGestureDisplay(type) {
const display = document.getElementById('gesture-display')
const names = {
heart: '🫰 Heart',
love: '✌️ I LOVE YOU',
scatter: '✋ Scatter',
gather: '✊ Gather'
}
display.textContent = `✨ Gesture: ${names[type] || 'None'}`
}

formHeart() {
for (let i = 0; i < this.particleCount; i++) {
const i3 = i * 3
const t = (i / this.particleCount) * Math.PI * 2
const scale = 1.8

let x = 16 * Math.pow(Math.sin(t), 3)
let y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)

const fill = Math.pow(Math.random(), 0.5)
x = (x / 17) * scale * fill
y = (y / 17) * scale * fill + 0.2

this.targetPositions[i3] = x + (Math.random() - 0.5) * 0.15
this.targetPositions[i3 + 1] = y + (Math.random() - 0.5) * 0.15
this.targetPositions[i3 + 2] = (Math.random() - 0.5) * 0.4
}
}

formText(text) {
const canvas = document.createElement('canvas')
const size = 512
canvas.width = size
canvas.height = size / 3
const ctx = canvas.getContext('2d')

ctx.fillStyle = 'white'
ctx.font = `bold ${size/8}px Arial, sans-serif`
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText(text, size/2, size/6)

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
const pixels = []

for (let y = 0; y < canvas.height; y += 2) {
for (let x = 0; x < canvas.width; x += 2) {
const idx = (y * canvas.width + x) * 4
if (imageData.data[idx + 3] > 128) {
pixels.push({
x: ((x / canvas.width) - 0.5) * 6,
y: ((0.5 - y / canvas.height)) * 2
})
}
}
}

for (let i = 0; i < this.particleCount; i++) {
const i3 = i * 3
if (pixels.length > 0) {
const p = pixels[Math.floor(Math.random() * pixels.length)]
this.targetPositions[i3] = p.x + (Math.random() - 0.5) * 0.08
this.targetPositions[i3 + 1] = p.y + (Math.random() - 0.5) * 0.08
this.targetPositions[i3 + 2] = (Math.random() - 0.5) * 0.3
}
}
}

scatter() {
for (let i = 0; i < this.particleCount; i++) {
const i3 = i * 3
const angle = Math.random() * Math.PI * 2
const radius = 3 + Math.random() * 7

this.targetPositions[i3] = Math.cos(angle) * radius
this.targetPositions[i3 + 1] = Math.sin(angle) * radius
this.targetPositions[i3 + 2] = (Math.random() - 0.5) * 5

this.velocities[i3] = (Math.random() - 0.5) * 0.1
this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1
this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.05
}
}

gather() {
for (let i = 0; i < this.particleCount; i++) {
const i3 = i * 3
const angle = Math.random() * Math.PI * 2
const r = Math.pow(Math.random(), 0.5) * 0.8

this.targetPositions[i3] = Math.cos(angle) * r
this.targetPositions[i3 + 1] = Math.sin(angle) * r
this.targetPositions[i3 + 2] = (Math.random() - 0.5) * 0.3
}
}

reset() {
for (let i = 0; i < this.particleCount * 3; i++) {
this.targetPositions[i] = this.originalPositions[i]
}
}

animate() {
requestAnimationFrame(() => this.animate())

const time = this.clock.getElapsedTime()
const positions = this.geometry.attributes.position.array

this.particles.material.uniforms.uTime.value = time

const lerpSpeed = this.currentFormation ? 0.08 : 0.03

for (let i = 0; i < this.particleCount; i++) {
const i3 = i * 3

// Apply velocity
positions[i3] += this.velocities[i3]
positions[i3 + 1] += this.velocities[i3 + 1]
positions[i3 + 2] += this.velocities[i3 + 2]

// Dampen velocity
this.velocities[i3] *= 0.95
this.velocities[i3 + 1] *= 0.95
this.velocities[i3 + 2] *= 0.95

// Lerp to target
positions[i3] += (this.targetPositions[i3] - positions[i3]) * lerpSpeed
positions[i3 + 1] += (this.targetPositions[i3 + 1] - positions[i3 + 1]) * lerpSpeed
positions[i3 + 2] += (this.targetPositions[i3 + 2] - positions[i3 + 2]) * lerpSpeed
}

this.geometry.attributes.position.needsUpdate = true
this.renderer.render(this.scene, this.camera)
}

onResize() {
this.camera.aspect = window.innerWidth / window.innerHeight
this.camera.updateProjectionMatrix()
this.renderer.setSize(window.innerWidth, window.innerHeight)
this.particles.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
}
}

// ==================== HAND TRACKER ====================
class HandTracker {
constructor(particleSystem) {
this.ps = particleSystem
this.video = document.getElementById('video')
this.hands = null
this.running = false
this.lastGesture = null
this.gestureFrames = 0
this.requiredFrames = 5
}

async start() {
try {
const stream = await navigator.mediaDevices.getUserMedia({
video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
})

this.video.srcObject = stream
await this.video.play()
this.video.classList.add('visible')

// Dynamic import MediaPipe
const handsModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js')
const Hands = handsModule.Hands

this.hands = new Hands({
locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
})

this.hands.setOptions({
maxNumHands: 1,
modelComplexity: 1,
minDetectionConfidence: 0.7,
minTrackingConfidence: 0.5
})

this.hands.onResults((results) => this.onResults(results))

this.running = true
this.detectLoop()

return true
} catch (err) {
console.error('Camera error:', err)
alert('Camera access error: ' + err.message + '\n\nTry using Demo mode instead!')
return false
}
}

stop() {
this.running = false
if (this.video.srcObject) {
this.video.srcObject.getTracks().forEach(track => track.stop())
this.video.srcObject = null
}
this.video.classList.remove('visible')
this.ps.setFormation(null)
}

async detectLoop() {
if (!this.running) return

try {
await this.hands.send({ image: this.video })
} catch (e) {
console.warn('Detection error:', e)
}

setTimeout(() => this.detectLoop(), 80)
}

onResults(results) {
if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
this.gestureFrames = 0
if (this.lastGesture !== null) {
this.lastGesture = null
this.ps.setFormation(null)
}
return
}

const landmarks = results.multiHandLandmarks[0]
const gesture = this.detectGesture(landmarks)

if (gesture === this.lastGesture) {
this.gestureFrames++
} else {
this.gestureFrames = 1
}

if (this.gestureFrames >= this.requiredFrames && gesture !== this.ps.currentFormation) {
this.lastGesture = gesture
this.ps.setFormation(gesture)
}
}

detectGesture(lm) {
const fingertips = [lm[4], lm[8], lm[12], lm[16], lm[20]]
const mcps = [lm[2], lm[5], lm[9], lm[13], lm[17]]

const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

const thumbIndexDist = dist(lm[4], lm[8])

const indexUp = lm[8].y < lm[5].y
const middleUp = lm[12].y < lm[9].y
const ringUp = lm[16].y < lm[13].y
const pinkyUp = lm[20].y < lm[17].y

// Finger heart: thumb and index close, others down
if (thumbIndexDist < 0.1 && !middleUp && !ringUp) {
return 'heart'
}

// Peace sign: index and middle up, ring and pinky down
if (indexUp && middleUp && !ringUp && !pinkyUp) {
return 'love'
}

// Open palm: all fingers up
if (indexUp && middleUp && ringUp && pinkyUp) {
return 'scatter'
}

// Fist: all fingers down
if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
return 'gather'
}

return null
}
}

// ==================== INITIALIZE APP ====================
const particleSystem = new ParticleSystem()
const handTracker = new HandTracker(particleSystem)

// Camera button
const btnCamera = document.getElementById('btn-camera')
btnCamera.addEventListener('click', async () => {
if (btnCamera.classList.contains('active')) {
handTracker.stop()
btnCamera.classList.remove('active')
} else {
const success = await handTracker.start()
if (success) {
btnCamera.classList.add('active')
btnDemo.classList.remove('active')
demoButtons.classList.remove('visible')
}
}
})

// Demo button
const btnDemo = document.getElementById('btn-demo')
const demoButtons = document.getElementById('demo-buttons')

btnDemo.addEventListener('click', () => {
const isActive = btnDemo.classList.contains('active')

if (isActive) {
btnDemo.classList.remove('active')
demoButtons.classList.remove('visible')
particleSystem.setFormation(null)
} else {
handTracker.stop()
btnCamera.classList.remove('active')
btnDemo.classList.add('active')
demoButtons.classList.add('visible')
}
})

// Demo gesture buttons
document.querySelectorAll('.demo-btn').forEach(btn => {
btn.addEventListener('touchstart', (e) => {
e.preventDefault()
const gesture = btn.dataset.gesture
particleSystem.setFormation(gesture)
btn.style.background = 'rgba(255,107,157,0.5)'
})

btn.addEventListener('touchend', () => {
particleSystem.setFormation(null)
btn.style.background = ''
})

btn.addEventListener('mousedown', () => {
const gesture = btn.dataset.gesture
particleSystem.setFormation(gesture)
btn.style.background = 'rgba(255,107,157,0.5)'
})

btn.addEventListener('mouseup', () => {
particleSystem.setFormation(null)
btn.style.background = ''
})

btn.addEventListener('mouseleave', () => {
btn.style.background = ''
})
})

// Theme button
const btnTheme = document.getElementById('btn-theme')
btnTheme.addEventListener('click', () => {
currentThemeIndex = (currentThemeIndex + 1) % themeNames.length
const themeName = themeNames[currentThemeIndex]
const theme = THEMES[themeName]
particleSystem.setTheme(theme)
btnTheme.innerHTML = `<span>🎨</span> ${theme.name}`
})

// Keyboard controls
document.addEventListener('keydown', (e) => {
if (!btnDemo.classList.contains('active')) return

const key = e.key.toLowerCase()
const keyMap = { h: 'heart', l: 'love', s: 'scatter', g: 'gather' }

if (keyMap[key]) {
particleSystem.setFormation(keyMap[key])
}
})

document.addEventListener('keyup', () => {
if (btnDemo.classList.contains('active')) {
particleSystem.setFormation(null)
}
})

console.log('🎨 Particle Gesture Art loaded!')
console.log('📱 Demo mode: Tap and hold gesture buttons')
console.log('⌨️ Keyboard: H=Heart, L=Love, S=Scatter, G=Gather')
