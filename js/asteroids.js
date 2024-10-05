
// Fetch the JSON data from the external file
fetch('https://raw.githubusercontent.com/dignacz/raccoons-orrery/refs/heads/main/asteroid_query_results.json')
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();  // Parse the JSON data from the response
})
.then(asteroidData => {
    window.asteroidData = asteroidData; // Store asteroid data globally for click access
    processAsteroidData(asteroidData);
})
.catch(error => console.error('Error loading the JSON file:', error));

// Degrees to Radians
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Calculate current time in Julian centuries since J2000.0
function getJulianCenturies() {
    const now = new Date();
    const JD = 2451545.0 + (now - new Date(Date.UTC(2000, 0, 1, 12))) / 86400000;
    return (JD - 2451545.0) / 36525.0;
}

// Function to calculate the current position of an object in its orbit
function calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp) {
    let t = getJulianCenturies(); // Current time in Julian centuries
    let tpCenturies = (tp - 2451545.0) / 36525.0; // Time of periapsis in Julian centuries
    let meanMotion = Math.sqrt(1 / Math.pow(semiMajorAxis, 3));
    let meanAnomaly = meanMotion * (t - tpCenturies);
    let trueAnomaly = meanAnomaly; // Simplified - normally we would iterate to solve Kepler's equation

    let r = (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) / (1 + eccentricity * Math.cos(trueAnomaly));

    let inclinationRad = degreesToRadians(inclination);
    let omegaRad = degreesToRadians(omega);
    let nodeRad = degreesToRadians(node);

    let xPrime = r * Math.cos(trueAnomaly);
    let yPrime = r * Math.sin(trueAnomaly);

    let x = xPrime * (Math.cos(nodeRad) * Math.cos(omegaRad) - Math.sin(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad))
            - yPrime * (Math.sin(nodeRad) * Math.cos(omegaRad) + Math.cos(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad));

    let y = xPrime * (Math.sin(nodeRad) * Math.cos(omegaRad) + Math.cos(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad))
            + yPrime * (Math.cos(nodeRad) * Math.cos(omegaRad) - Math.sin(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad));

    let z = xPrime * (Math.sin(omegaRad) * Math.sin(inclinationRad)) + yPrime * (Math.cos(omegaRad) * Math.sin(inclinationRad));

    return `${x} ${y} ${z}`;
}

// Function to animate the ball along the asteroid orbit points
function animateAsteroidBall(orbitPoints) {
    let pointIndex = 0;

    function moveBall() {
        if (pointIndex >= orbitPoints.length) {
            pointIndex = 0; // Loop back to start
        }
        const ballTransform = document.getElementById('asteroidOrbitBall');
        if (ballTransform) {
            ballTransform.setAttribute('translation', orbitPoints[pointIndex]);
        } else {
            console.error("Asteroid ball transform not found");
        }
        pointIndex++;

        requestAnimationFrame(moveBall);
    }
    moveBall();
}

// Function to add a ball to the asteroid's orbit
function addBallToAsteroidOrbit(orbitPoints) {
    const scene = document.querySelector('scene');
    if (!scene) {
        console.error("Scene not found");
        return;
    }

    const ballTransform = document.createElement('transform');
    ballTransform.setAttribute('id', 'asteroidOrbitBall');

    const ballShape = document.createElement('shape');
    const ballAppearance = document.createElement('appearance');
    const ballMaterial = document.createElement('material');
    ballMaterial.setAttribute('diffuseColor', '0 1 0'); // Green color for the ball
    ballAppearance.appendChild(ballMaterial);
    ballShape.appendChild(ballAppearance);

    const ballSphere = document.createElement('sphere');
    ballSphere.setAttribute('radius', '0.05'); // Small sphere for the asteroid ball
    ballShape.appendChild(ballSphere);

    ballTransform.appendChild(ballShape);
    scene.appendChild(ballTransform);

    animateAsteroidBall(orbitPoints);
}


// Function to create and append asteroid orbit and position marker to x3dom scene
function createAsteroidOrbitShape(orbitPoints, currentPosition, objectId, pha = "N") {
    let asteroidContainerPHA = document.getElementById("asteroidOrbitContainerPHA");
    let asteroidContainerNonPHA = document.getElementById("asteroidOrbitContainerNonPHA");

    if (pha === "Y") {
        asteroidContainerPHA = document.getElementById("asteroidOrbitContainerPHA");
        asteroidContainerPHA.setAttribute('visible', 'false'); // Ensure it's visible by default
    } else {
        asteroidContainerNonPHA = document.getElementById("asteroidOrbitContainerNonPHA");
        asteroidContainerNonPHA.setAttribute('visible', 'false'); // Ensure it's visible by default
    }

    const asteroidShape = document.createElement("shape");
    asteroidShape.setAttribute("id", objectId); // Set object ID for click event association

    const aAppearance = document.createElement("appearance");
    const aMaterial = document.createElement("material");
    if (pha === "Y") {
        aMaterial.setAttribute("emissiveColor", "1 0 0"); // Red color for potentially hazardous asteroids
    } else {
        aMaterial.setAttribute("emissiveColor", "0.30 0.30 0.30"); // Grey color for non-hazardous asteroids
    }
    aAppearance.appendChild(aMaterial);
    asteroidShape.appendChild(aAppearance);

    const aIndexedLineSet = document.createElement("indexedLineSet");
    let coordIndex = Array.from({ length: orbitPoints.length }, (_, i) => i).join(' ') + " -1";
    aIndexedLineSet.setAttribute("coordIndex", coordIndex);

    const aCoordinate = document.createElement("coordinate");
    aCoordinate.setAttribute("point", orbitPoints.join(' '));
    aIndexedLineSet.appendChild(aCoordinate);

    asteroidShape.appendChild(aIndexedLineSet);
    if (pha === "Y") {
        asteroidContainerPHA.appendChild(asteroidShape);
    } else {
        asteroidContainerNonPHA.appendChild(asteroidShape);
    }

    // Create a sphere to mark the current position of the asteroid
    const currentShape = document.createElement("shape");

    const currentAppearance = document.createElement("appearance");
    const currentMaterial = document.createElement("material");
    currentMaterial.setAttribute("diffuseColor", "0 1 0"); // Green for the current position marker
    currentAppearance.appendChild(currentMaterial);
    currentShape.appendChild(currentAppearance);

    const currentTransform = document.createElement("transform");
    currentTransform.setAttribute("translation", currentPosition);
    const currentSphere = document.createElement("sphere");
    currentShape.setAttribute("id", objectId); // Set object ID for click event association
    currentSphere.setAttribute("radius", "0.008");
    currentShape.appendChild(currentSphere);
    currentTransform.appendChild(currentShape);
    if (pha === "Y") {
        asteroidContainerPHA.appendChild(currentTransform);
    } else {
        asteroidContainerNonPHA.appendChild(currentTransform);
    }
}

// Update processAsteroidData to handle full attribute display
function processAsteroidData(asteroidData) {
    asteroidData.forEach(obj => {
        const eccentricity = parseFloat(obj.e);
        const semiMajorAxis = parseFloat(obj.a);
        const inclination = parseFloat(obj.i);
        const omega = parseFloat(obj.w);
        const node = parseFloat(obj.om);
        const tp = parseFloat(obj.tp);
        const PHA = obj.pha; // Corrected to retrieve PHA as a string
        const objectId = obj.full_name;

        // Calculate the orbit points and current position
        const aOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);

        // Plot the orbit and the current position in X3D
        createAsteroidOrbitShape(aOrbitPoints, currentPosition, objectId, PHA);
    });
}