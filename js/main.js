import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls'
import { OBJLoader } from 'OBJLoader';
import { MTLLoader } from 'MTLLoader';

const canvasEl = document.querySelector('#canvas');
const rollBtn = document.querySelector('#roll-btn');
const nextBtn = document.querySelector('#next-btn');

let renderer, scene, camera, physicsWorld, raycaster, controls;

// Assuming you have an array of player scores
var playerScores = [];
playerScores[0] =  { player: 'P0', score: [], throws: 0 };

var isGameStarted = false;

var currentPlayer = 0;
var nbrPlayers = 0;
var maxAvailableThrows = 3;
var availableThrow = maxAvailableThrows;

// Retrieve the table element
const table = document.getElementById('score-table');
// Get the table body element
const tbody = table.getElementsByTagName('tbody')[0];
// Get the rows
var rows = tbody.getElementsByTagName('tr');

const params = {
    numberOfDice: 3,
    segments: 30,
    edgeRadius: .07,
    notchRadius: .12,
    notchDepth: .1,
};

const diceArray = [];

const pointer = new THREE.Vector2();

var isStable = false;
var stableCnt = 0;

canvasEl.addEventListener('mousedown', onMouseDown);

raycaster = new THREE.Raycaster();

initPhysics();
initScene();

window.addEventListener('resize', updateSceneSize);
rollBtn.addEventListener('click', throwDice);
nextBtn.addEventListener('click', nextPlayer);

////////////////////////////////////////////////////
////////////////////////////////////////////////////
/////////////////////  UI  /////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

const menuContainer = document.querySelector('.menu-container');
const contentContainer = document.querySelector('.content');
const playerInput = document.getElementById('player-input');
const playBtn = document.getElementById('play-btn');
const resumeBtn = document.getElementById('resume-btn');
const returnBtn = document.getElementById('return-btn');

playBtn.addEventListener('click', function() {
    const numPlayers = parseInt(playerInput.value);

    if (numPlayers >= 1 && numPlayers <= 7) {
        menuContainer.classList.add('hidden');
        contentContainer.classList.remove('hidden');
        initializeGame(numPlayers); // Call the game initialization function with the number of players
    } else {
        console.log("Issue with nbr of players");
        alert('Please enter a number between 1 and 7 for the number of players.');
    }
});

resumeBtn.addEventListener('click', function() {
    menuContainer.classList.add('hidden');
    contentContainer.classList.remove('hidden');
});

returnBtn.addEventListener('click', function() {
    console.log("Return button");
    menuContainer.classList.remove('hidden');
    contentContainer.classList.add('hidden');
    // Additional logic to reset the game if needed
});

function initializeGame(numPlayers) {
    console.log("Starting game for " + numPlayers + " players");
    nbrPlayers = numPlayers
    // Game initialization logic goes here
    // You can access the number of players using the 'numPlayers' parameter
    // Assuming you have an array of player scores

    playerScores = [];

    for (let i = 0; i < numPlayers; i++) { 
        playerScores[i] =  { player: 'P'+(i+1), score: [], throws: 0 };
    }

    fillScore();

    // Add the highlight-row class to the chosen row
    currentPlayer = 0;
    var firstCell = rows[currentPlayer].querySelector('td:first-child');
    firstCell.classList.add('highlight-row');

    rollBtn.disabled = false;
    nextBtn.disabled = true;

    for(const dice of diceArray) {
        resetDice(dice.mesh.getObjectByName("outDice"));
        dice.mesh.getObjectByName("outDice").material[0].color = new THREE.Color(Math.random(), Math.random(), Math.random());
    }

    rows[currentPlayer].scrollIntoView();
}

function fillScore() {
    console.log("Adding Scores");

    // Clear the existing table rows
    tbody.innerHTML = '';

    // Loop through the player scores and create table rows dynamically
    for (let i = 0; i < playerScores.length; i++) {
        const player = playerScores[i].player;
        const score = playerScores[i].score;
        const throws = playerScores[i].throws;

        // Create a new table row
        const row = document.createElement('tr');

        // Create a table cell for the player
        const playerCell = document.createElement('td');
        playerCell.textContent = player;
        row.appendChild(playerCell);

        // Create a table cell for the score
        const scoreCell = document.createElement('td');

        // Create three square box elements
        for (let j = 0; j < 3; j++) {
            const box = document.createElement('div');
            box.className = 'dice-button';
            switch (score[j]) {
                case 1:
                    box.innerHTML = "&#9856;"; // Unicode character for face 1
                    break;
                case 2:
                    box.innerHTML = "&#9857;"; // Unicode character for face 2
                    break;
                case 3:
                    box.innerHTML = "&#9858;"; // Unicode character for face 3
                    break;
                case 4:
                    box.innerHTML = "&#9859;"; // Unicode character for face 4
                    break;
                case 5:
                    box.innerHTML = "&#9860;"; // Unicode character for face 5
                    break;
                case 6:
                    box.innerHTML = "&#9861;"; // Unicode character for face 6
                    break;
            }
            scoreCell.appendChild(box);
        }

        row.appendChild(scoreCell);

        const throwsCell = document.createElement('td');
        throwsCell.textContent = throws;
        row.appendChild(throwsCell);
        
        // Append the row to the table body
        tbody.appendChild(row);
    }
}

function modifScore(i) {
    console.log("Modif Score");
    const score = playerScores[i].score;
    const throws = playerScores[i].throws;
  
    // Get the existing row for the player (if it exists)
    const existingRow = rows[i];
  
    if (existingRow) {
      // Update the score cell for the player
      const scoreCell = existingRow.querySelector('td:nth-child(2)');
      scoreCell.innerHTML = ''; // Clear the existing score
  
      // Create and append three square box elements for the updated score
      for (let j = 2; j >= 0; j--) {
        const box = document.createElement('div');
        box.className = 'dice-button';
        switch (score[j]) {
          case 1:
            box.innerHTML = "&#9856;"; // Unicode character for face 1
            break;
          case 2:
            box.innerHTML = "&#9857;"; // Unicode character for face 2
            break;
          case 3:
            box.innerHTML = "&#9858;"; // Unicode character for face 3
            break;
          case 4:
            box.innerHTML = "&#9859;"; // Unicode character for face 4
            break;
          case 5:
            box.innerHTML = "&#9860;"; // Unicode character for face 5
            break;
          case 6:
            box.innerHTML = "&#9861;"; // Unicode character for face 6
            break;
        }
        scoreCell.appendChild(box);
      }

      const throwsCell = existingRow.querySelector('td:last-child');
      throwsCell.innerHTML = throws; // Clear the existing score
    }
    console.log(playerScores);
  }
  

function nextPlayer() {

    if(!isStable || rows.length < 1){
        return;
    }

    // Remove old
    var cell = rows[currentPlayer].querySelector('td:first-child');
    cell.classList.remove('highlight-row');

    // Update score and throws
    modifScore(currentPlayer);
    // Need to add End Game Check
    if (currentPlayer == 0) {
        availableThrow = playerScores[currentPlayer].throws;
    }
    currentPlayer = currentPlayer + 1
    if (currentPlayer >= nbrPlayers) {
        // End of game
        console.log("End of the Game");

        calculateGlobalScore();

        currentPlayer = currentPlayer % nbrPlayers;
        availableThrow = maxAvailableThrows;
    }

    playerScores[currentPlayer].score = [];
    playerScores[currentPlayer].throws = 0;
    rollBtn.disabled = false;
    nextBtn.disabled = true;

    for(const dice of diceArray) {
        resetDice(dice.mesh.getObjectByName("outDice"));
    }

    const row = rows[currentPlayer];
    cell = row.querySelector('td:first-child');
    cell.classList.add('highlight-row');

    row.scrollIntoView({ block: "end" });
}

function calculateGlobalScore() {
    console.log("Calculating scores");
    var totalPoints = 0;
    var loser = 0;
    var currentWorst = 100000;
    var combiWorst = 100000;
    var current = 0;
    var point = 0;

    for (let i = 0; i < playerScores.length; i++) { 

        [current, point] = calculatePoints(playerScores[i].score);
        totalPoints += point;

        if (current < currentWorst) {
            currentWorst = current;
            combiWorst = getCombi(playerScores[i].score);
            loser = i;
        }
    }

    const message = `P${loser + 1} lost the round with ${combiWorst}, the total was ${totalPoints} pts`;
    alert(message);
}

function calculatePoints(arr) {
    const first = arr[2];
    const second = arr[1];
    const third = arr[0];

    if (first === 4 && second === 2 && third === 1) {
        return [10000, 8];
    }

    if (first === 1) {
        if (third === 1) {
            return [7000, 7];
        } else {
            return [1000 * third, third];
        }
    }

    if (first === second && first === third) {
        return [1000 + 100 * first + 10 * second + third, third];
    }

    if (first === second + 1 && second === third + 1) {
        return [700 + 100 * (first - 3), 2];
    }

    if (first === 2 && second === 2 && third === 2) {
        return [221, 4];
    }

    return [100 * first + 10 * second + third, 1];
}  

function getCombi(arr) {
    return 100 * arr[2] + 10 * arr[1] + arr[0];
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
///////////////////  Events  ///////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

function onMouseDown(event) {

    if(!isStable || playerScores[currentPlayer].throws == 0){
        return;
    }

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( scene.children, true );

    if ( intersects.length > 0 ) {

        for (let i = 0; i < intersects.length; i++) {
            const intersectedObject = intersects[i].object;
        
            if (intersectedObject.name === "outDice") {
                toggleDice(intersectedObject);
                break; // Exit the loop after toggling one dice
            }
        }

    }
}

function toggleDice(diceOutMesh) {
    console.log("Toggle dice : " + diceOutMesh.index);
    diceOutMesh.isToggled = !diceOutMesh.isToggled;
    if (diceOutMesh.isToggled) {
        diceOutMesh.material[0].color.set(0x00ff00);
        diceArray[diceOutMesh.index].body.mass = 1000;
        diceArray[diceOutMesh.index].body.updateMassProperties();
    } else {
        diceOutMesh.material[0].color.set(0xeeeeee);
        diceArray[diceOutMesh.index].body.mass = 1;
        diceArray[diceOutMesh.index].body.updateMassProperties();
    }
}

function resetDice(diceOutMesh) {
    console.log("Reset dice : " + diceOutMesh.index);
    if (diceOutMesh.isToggled) {
        diceOutMesh.isToggled = false;
        diceOutMesh.material[0].color.set(0xeeeeee);
        diceArray[diceOutMesh.index].body.mass = 1;
        diceArray[diceOutMesh.index].body.updateMassProperties();
    }
}

function throwDice() {

    if(!isStable) {
        console.log("Dice are not stable !");
        return;
    }

    if(!isGameStarted) {
        isGameStarted = true;
    }
    
    var oneMoved = false;

    diceArray.forEach((d, dIdx) => {
        if (d.body.mass === 1000) {
            return;
        }
        oneMoved = true;
    
        stableCnt--;

        throwDie(d, dIdx)
    });

    isStable = !oneMoved;
}

function throwDie(d, dIdx) {
    d.body.velocity.setZero();
    d.body.angularVelocity.setZero();

    d.body.position = new CANNON.Vec3(5, dIdx * 1.5 + 10, 0);
    d.mesh.position.copy(d.body.position);

    d.mesh.rotation.set(2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random())
    d.body.quaternion.copy(d.mesh.quaternion);

    const forceX = 5 + 25 * Math.random();
    const forceY = 5 + 25 * Math.random();
    d.body.applyImpulse(
        new CANNON.Vec3(-forceX, -forceY, 0),
        new CANNON.Vec3(0, Math.random(), Math.random())
    );

    d.body.allowSleep = true;
}

function addDiceEvents(dice) {
    dice.body.addEventListener('sleep', (e) => {

        dice.body.allowSleep = false;

        const euler = new CANNON.Vec3();
        e.target.quaternion.toEuler(euler);

        const eps = .1;
        let isZero = (angle) => Math.abs(angle) < eps;
        let isHalfPi = (angle) => Math.abs(angle - .5 * Math.PI) < eps;
        let isMinusHalfPi = (angle) => Math.abs(.5 * Math.PI + angle) < eps;
        let isPiOrMinusPi = (angle) => (Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps);

        if (isZero(euler.z)) {
            if (!isZero(euler.x) && !isHalfPi(euler.x) && !isMinusHalfPi(euler.x) && !isPiOrMinusPi(euler.x)) {
                // landed on edge => wait to fall on side and fire the event again
                console.log("Is Stuck ?");
                dice.body.allowSleep = true;
            }
        } else if (!isHalfPi(euler.z) && !isMinusHalfPi(euler.z)) {
            // landed on edge => wait to fall on side and fire the event again
            console.log("Is Stuck ?");
            dice.body.allowSleep = true;
        }

        stableCnt++;
        checkAllStable();

    });
}

function calculateValue(dice, diceId) {

    const euler = new CANNON.Vec3();
    dice.body.quaternion.toEuler(euler);

    const eps = .1;
    let isZero = (angle) => Math.abs(angle) < eps;
    let isHalfPi = (angle) => Math.abs(angle - .5 * Math.PI) < eps;
    let isMinusHalfPi = (angle) => Math.abs(.5 * Math.PI + angle) < eps;
    let isPiOrMinusPi = (angle) => (Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps);

    var scoreArr = playerScores[currentPlayer].score;

    if (isZero(euler.z)) {
        if (isZero(euler.x)) {
            scoreArr[diceId] = 1;
        } else if (isHalfPi(euler.x)) {
            scoreArr[diceId] = 4;
        } else if (isMinusHalfPi(euler.x)) {
            scoreArr[diceId] = 3;
        } else if (isPiOrMinusPi(euler.x)) {
            scoreArr[diceId] = 6;
        } else {
            // landed on edge => wait to fall on side and fire the event again
            console.log("Is Stuck ?");
        }
    } else if (isHalfPi(euler.z)) {
        scoreArr[diceId] = 2;
    } else if (isMinusHalfPi(euler.z)) {
        scoreArr[diceId] = 5;
    } else {
        // landed on edge => wait to fall on side and fire the event again
        console.log("Is Stuck ?");
    }
}

function calculateCombi(newScores) {
    // Sort the array in desc order

    newScores.sort(function(a, b) {
        return a - b;
    });

    // Handle double 1
    if (newScores[1] == 1) {
        newScores[0] = newScores[2];
        newScores[2] = 1;
        return;
    }

    // Handle 221
    if (newScores[2] == 2 && newScores[1] == 2 && newScores[0] == 1 ) {
        alert("You are quite bad at this game...");
    }
}

function checkAllStable() {

    if(stableCnt != diceArray.length) {
        console.log("Some dice are not stable...")
        return;
    }
    var checkStable = true;

    diceArray.forEach((d, dIdx) => {
        if(d.body.allowSleep) {
            checkStable = false;
            stableCnt--;
            throwDie(d, dIdx);
        }
    });

    isStable = checkStable;

    if (isStable) {
        console.log("Dice are stable !");

        if(!isGameStarted){
            return;
        }

        playerScores[currentPlayer].throws = playerScores[currentPlayer].throws + 1;
        for (let i = 0; i < diceArray.length; i++) {
            calculateValue(diceArray[i], i);
        }
        console.log("Changed dice value");
        
        calculateCombi(playerScores[currentPlayer].score);

        // Update score and throws
        modifScore(currentPlayer);
        if (playerScores[currentPlayer].throws >= availableThrow) {
            console.log("Can't throw anymore !");
            rollBtn.disabled = true;
        }
        nextBtn.disabled = false;

    }
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
/////////////////  Rendering  //////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

function render() {
    physicsWorld.fixedStep();

    for (const dice of diceArray) {
        dice.mesh.position.copy(dice.body.position)
        dice.mesh.quaternion.copy(dice.body.quaternion)
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function updateSceneSize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
///////////////  Scene Element   ///////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

function initScene() {

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas: canvasEl
    });
    renderer.shadowMap.enabled = true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 100)
    camera.position.set(0, 30, 30);

    // Orbit controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 1.2
    controls.enableDamping = true
    controls.enablePan = false
    controls.dampingFactor = 0.2
    controls.minDistance = 1
    controls.maxDistance = 40

    updateSceneSize();

    const ambientLight = new THREE.AmbientLight(0xffffff, .5);
    scene.add(ambientLight);
    const topLight = new THREE.PointLight(0xffffff, .5);
    topLight.position.set(10, 15, 0);
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 2048;
    topLight.shadow.mapSize.height = 2048;
    topLight.shadow.camera.near = 5;
    topLight.shadow.camera.far = 400;
    scene.add(topLight);
    
    createBorders();

    for (let i = 0; i < params.numberOfDice; i++) {
        diceArray.push(createDice(i));
        addDiceEvents(diceArray[i]);
    }

    render();
}

function initPhysics() {
    physicsWorld = new CANNON.World({
        allowSleep: true,
        gravity: new CANNON.Vec3(0, -50, 0),
    })
    physicsWorld.defaultContactMaterial.restitution = .3;
}

function createBorders() {

    const wallMaterial = new THREE.ShadowMaterial({
        opacity: .1
    });

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(13, 13),
        wallMaterial
    );
    floor.name = "wall";
    floor.receiveShadow = true;

    // Create the border line
    const edges = new THREE.EdgesGeometry(floor.geometry);
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const borderLine = new THREE.LineSegments(edges, borderMaterial);
    borderLine.position.copy(floor.position);
    borderLine.position.y += 0.01; // Raise the line slightly above the floor
    borderLine.rotation.x = -Math.PI / 2; // Rotate the line to align with the floor
    scene.add(borderLine);

    // Rotate the plane along the x-axis
    floor.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * 0.5);
    
    scene.add(floor);

    const floorBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
    });
    floorBody.position.copy(floor.position);
    floorBody.quaternion.copy(floor.quaternion);
    physicsWorld.addBody(floorBody);

    // Walls
    const wallOptions = {
        width: 14,
        height: 15,
        depth: 1,
    };

    function createWall(x, z, isParallel) {

        if (isParallel) {

            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(wallOptions.depth, wallOptions.height, wallOptions.width),
                wallMaterial
            );
            wall.position.set(x, wallOptions.height * 0.5, z);
            wall.receiveShadow = true;
            wall.name = "wall";
            scene.add(wall);

            const wallBody = new CANNON.Body({
                type: CANNON.Body.STATIC,
                shape: new CANNON.Box(new CANNON.Vec3(wallOptions.depth * 0.5, wallOptions.height * 0.5, wallOptions.width * 0.5)),
            });
            wallBody.position.copy(wall.position);
            physicsWorld.addBody(wallBody);

        } else {

            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(wallOptions.width, wallOptions.height, wallOptions.depth),
                wallMaterial
            );
            wall.position.set(x, wallOptions.height * 0.5, z);
            wall.receiveShadow = true;
            wall.name = "wall";
            scene.add(wall);

            const wallBody = new CANNON.Body({
                type: CANNON.Body.STATIC,
                shape: new CANNON.Box(new CANNON.Vec3(wallOptions.width * 0.5, wallOptions.height * 0.5, wallOptions.depth * 0.5)),
            });
            wallBody.position.copy(wall.position);
            physicsWorld.addBody(wallBody);
        }

    }

    createWall(-wallOptions.width * 0.5, 0, true); // Left wall
    createWall(wallOptions.width * 0.5, 0, true); // Right wall
    createWall(0, -wallOptions.width * 0.5, false); // Back wall
    createWall(0, wallOptions.width * 0.5, false); // Front wall

}

function createDiceMesh(id) {

    const diceMesh = new THREE.Group();

    // Create a material loader
    const mtlLoader = new MTLLoader();

    // Load the .mtl file
    mtlLoader.load('dice.mtl', (materials) => {
        materials.preload();

        const loader = new OBJLoader();
        loader.setMaterials(materials);

        loader.load('dice.obj', function (object) {
            // Callback function called when the model is loaded

            // Set the material for the loaded object
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.name = "outDice";
                    child.isToggled = false;
                    child.index = id;
                }
            });


            object.rotation.set(0, Math.PI / 2, 0);

            // Get the bounding box of the mesh
            const boundingBox = new THREE.Box3().setFromObject(object);

            // Calculate the size of the bounding box
            const boundingBoxSize = new THREE.Vector3();
            boundingBox.getSize(boundingBoxSize);

            // Calculate the scale factor for resizing
            const scaleFactor = new THREE.Vector3(
                1.05 / boundingBoxSize.x,
                1.05 / boundingBoxSize.y,
                1.05 / boundingBoxSize.z
            );
            object.scale.copy(scaleFactor);

            diceMesh.add(object);

        },
        function( xhr ){
            console.log( (xhr.loaded / xhr.total * 100) + "% loaded")
        },
        function( err ){
            console.error( "Error loading .obj")
        });
    });

    return diceMesh;
}

function createDice(id) {
    const mesh = createDiceMesh(id);

    scene.add(mesh);

    const body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(new CANNON.Vec3(.5, .5, .5)),
        sleepTimeLimit: .1
    });
    physicsWorld.addBody(body);

    return {mesh, body};
}