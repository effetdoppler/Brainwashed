let scene, camera, renderer, loader, brainModel, controls;
let score = 0;
let timeLeft = 60;
let gameActive = false;
let currentGreenPointIndex = -1;
let pointColors = [];

const scoreDisplay = document.createElement('div');
scoreDisplay.style.cssText = `
    position: absolute;
    top: 20px;
    left: 20px;
    color: #00ff9d;
    font-size: 24px;
    text-shadow: 0 0 10px #00ff9d;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    letter-spacing: 2px;
`;
scoreDisplay.innerHTML = 'Score: 0';
document.body.appendChild(scoreDisplay);

const timerDisplay = document.createElement('div');
timerDisplay.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    color: #00ff9d;
    font-size: 24px;
    text-shadow: 0 0 10px #00ff9d;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    letter-spacing: 2px;
`;
timerDisplay.innerHTML = 'Time: 60s';
document.body.appendChild(timerDisplay);

const startButton = document.createElement('button');
startButton.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border: 2px solid #00ff9d;
    background: rgba(0, 0, 0, 0.7);  /* Fond noir semi-transparent */
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);  /* Légère lueur par défaut */
`;
startButton.innerHTML = 'Start Game';
document.body.appendChild(startButton);

startButton.addEventListener('mouseenter', () => {
    startButton.style.background = 'rgba(0, 0, 0, 0.85)';
    startButton.style.boxShadow = '0 0 20px #00ff9d';
    startButton.style.transform = 'translate(-50%, -50%) scale(1.05)';
    startButton.style.borderColor = '#00ff9d';
});

startButton.addEventListener('mouseleave', () => {
    startButton.style.background = 'rgba(0, 0, 0, 0.7)';
    startButton.style.boxShadow = '0 0 10px rgba(0, 255, 157, 0.3)';
    startButton.style.transform = 'translate(-50%, -50%) scale(1)';
    startButton.style.borderColor = '#00ff9d';
});

function startGame() {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    startButton.style.display = 'none';
    scoreDisplay.innerHTML = 'Score: 0';
    updateGreenPoint();
    startTimer();
}

function endGame() {
    gameActive = false;
    startButton.style.display = 'block';
    startButton.style.background = 'rgba(0, 0, 0, 0.85)';
    startButton.style.padding = '2rem 3rem';
    startButton.innerHTML = `
        <span style="color: #00ff9d; font-size: 1.4rem; display: block; margin-bottom: 0.5rem;">Game Over!</span>
        <span style="font-size: 1.2rem;">Score: ${score}</span><br>
        <span style="font-size: 0.9rem; color: #00ff9d;">Click to play again</span>
    `;
    startButton.style.textAlign = 'center';

    if (currentGreenPointIndex !== -1) {
        resetPointColor(currentGreenPointIndex);
    }
}

function startTimer() {
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        timerDisplay.innerHTML = `Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function resetPointColor(index) {
    const pinkColor = new THREE.Color(0xFF69B4);
    pointColors[index * 3] = pinkColor.r;
    pointColors[index * 3 + 1] = pinkColor.g;
    pointColors[index * 3 + 2] = pinkColor.b;

    brainModel.geometry.attributes.color.array = new Float32Array(pointColors);
    brainModel.geometry.attributes.color.needsUpdate = true;
}

const pinkMaterial = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true,
    color: 0xFF69B4
});

const greenMaterial = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    color: 0x00FF00,
    transparent: true,
    opacity: 0.8
});

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    foundSound = new Audio('sounds/found.mp3');
    foundSound.volume = 0.5;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    loader = new THREE.GLTFLoader();

    loader.load('assets/Brain.glb',
        function (gltf) {
            let positions = [];
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    const geometry = child.geometry;
                    const positionAttribute = geometry.attributes.position;

                    for (let i = 0; i < positionAttribute.count; i++) {
                        positions.push(
                            positionAttribute.getX(i),
                            positionAttribute.getY(i),
                            positionAttribute.getZ(i)
                        );
                    }
                }
            });

            const pointGeometry = new THREE.BufferGeometry();
            pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            brainModel = new THREE.Points(pointGeometry, pinkMaterial);

            const box = new THREE.Box3().setFromObject(brainModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;

            brainModel.scale.set(scale, scale, scale);
            brainModel.position.sub(center.multiplyScalar(scale));

            scene.add(brainModel);

            window.addEventListener('click', onMouseClick);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.minDistance = 3;
            controls.maxDistance = 8;
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.autoRotate = false;
            controls.autoRotateSpeed = 2.0;
        }
    );

    animate();
}

function updateGreenPoint() {
    if (!brainModel || !gameActive) return;

    const positions = brainModel.geometry.attributes.position.array;
    const numPoints = positions.length / 3;

    foundSound.currentTime = 0;
    foundSound.play();

    const oldGreenPoint = scene.getObjectByName('greenPoint');
    const oldCollisionSphere = scene.getObjectByName('greenPointCollider');
    if (oldGreenPoint) {
        scene.remove(oldGreenPoint);
    }
    if (oldCollisionSphere) {
        scene.remove(oldCollisionSphere);
    }

    const oldIndex = currentGreenPointIndex;
    do {
        currentGreenPointIndex = Math.floor(Math.random() * numPoints);
    } while (currentGreenPointIndex === oldIndex);

    const greenPointGeometry = new THREE.BufferGeometry();
    const greenPointPosition = new Float32Array([
        positions[currentGreenPointIndex * 3],
        positions[currentGreenPointIndex * 3 + 1],
        positions[currentGreenPointIndex * 3 + 2]
    ]);
    greenPointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(greenPointPosition, 3));

    const greenPoint = new THREE.Points(greenPointGeometry, greenMaterial.clone());
    greenPoint.name = 'greenPoint';
    greenPoint.scale.copy(brainModel.scale);
    greenPoint.position.copy(brainModel.position);

    const collisionGeometry = new THREE.SphereGeometry(0.15);
    const collisionMaterial = new THREE.MeshBasicMaterial({
        visible: false
    });
    const collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    collisionSphere.position.set(
        greenPointPosition[0] * brainModel.scale.x,
        greenPointPosition[1] * brainModel.scale.y,
        greenPointPosition[2] * brainModel.scale.z
    );
    collisionSphere.position.add(brainModel.position);
    collisionSphere.name = 'greenPointCollider';

    scene.add(greenPoint);
    scene.add(collisionSphere);
}

function onMouseClick(event) {
    if (!gameActive) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const collisionSphere = scene.getObjectByName('greenPointCollider');
    if (collisionSphere) {
        const intersects = raycaster.intersectObject(collisionSphere);
        if (intersects.length > 0) {
            score++;
            scoreDisplay.innerHTML = `Score: ${score}`;
            updateGreenPoint();
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (brainModel) {
        controls.update();
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);
window.addEventListener('load', init);
startButton.addEventListener('click', startGame);