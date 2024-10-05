// Fetch the JSON data from the external file
fetch('https://data.nasa.gov/resource/b67r-rgxc.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();  // Parse the JSON data from the response
    })
    .then(cometData => {
        window.cometData = cometData; // Store comet data globally for click access
        processCometData(cometData);
    })
    .catch(error => console.error('Error loading the JSON file:', error));

// Function to calculate semi-major axis
function calculateSemiMajorAxis(e, q) {
    if (e >= 1) {
        return Infinity; // For parabolic or hyperbolic orbits
    }
    return q / (1 - e);  // Semi-major axis formula
}

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

// 1. Function to calculate semi-major axis
function calculateSemiMajorAxis(e, q) {
    if (e >= 1) {
        return Infinity; // For parabolic or hyperbolic orbits
    }
    return q / (1 - e);  // Semi-major axis formula
}

// 2. Function to calculate the orbit points
function calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node, numPoints = 100) {
    let points = [];
    let inclinationRad = degreesToRadians(inclination);
    let omegaRad = degreesToRadians(omega);
    let nodeRad = degreesToRadians(node);

    // Loop to calculate points along the orbit
    for (let i = 0; i < numPoints; i++) {
        let trueAnomaly = (2 * Math.PI * i) / numPoints;
        let r = (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) / (1 + eccentricity * Math.cos(trueAnomaly));

        let xPrime = r * Math.cos(trueAnomaly);
        let yPrime = r * Math.sin(trueAnomaly);

        let x = xPrime * (Math.cos(nodeRad) * Math.cos(omegaRad) - Math.sin(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad))
                - yPrime * (Math.sin(nodeRad) * Math.cos(omegaRad) + Math.cos(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad));

        let y = xPrime * (Math.sin(nodeRad) * Math.cos(omegaRad) + Math.cos(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad))
                + yPrime * (Math.cos(nodeRad) * Math.cos(omegaRad) - Math.sin(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad));

        let z = xPrime * Math.sin(omegaRad) * Math.sin(inclinationRad) + yPrime * Math.cos(omegaRad) * Math.sin(inclinationRad);

        points.push(`${x} ${y} ${z}`);
    }

    return points;
}

// 3. Function to calculate the current position of a comet in its orbit
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

// Function to create and append comet orbit and position marker to x3dom scene
function createCometeOrbitShape(cOrbitPoints, currentPosition,  objectId) {
    const cometOrbitContainer = document.getElementById("cometOrbitContainer");
    cometOrbitContainer.setAttribute('visible', 'false'); // Ensure it's visible by default

    const cometShape = document.createElement("shape");
    const cAppearance = document.createElement("appearance");
    const cMaterial = document.createElement("material");
    cMaterial.setAttribute("emissiveColor", "0 0 0.1"); // Light blue color for comets
    cAppearance.appendChild(cMaterial);
    cometShape.appendChild(cAppearance);

    const cIndexedLineSet = document.createElement("indexedLineSet");
    let coordIndex = Array.from({ length: cOrbitPoints.length }, (_, i) => i).join(' ') + " -1";
    cIndexedLineSet.setAttribute("coordIndex", coordIndex);

    const cCoordinate = document.createElement("coordinate");
    cCoordinate.setAttribute("point", cOrbitPoints.join(' '));
    cIndexedLineSet.appendChild(cCoordinate);

    cometShape.appendChild(cIndexedLineSet);
    cometOrbitContainer.appendChild(cometShape);

    // Create a sphere to mark the current position of the comet
    const currentShape = document.createElement("shape");
    const currentAppearance = document.createElement("appearance");
    const currentMaterial = document.createElement("material");
    currentMaterial.setAttribute("diffuseColor", "0.53 0.81 0.98"); // Light blue for the current position marker
    currentAppearance.appendChild(currentMaterial);
    currentShape.appendChild(currentAppearance);

    const currentTransform = document.createElement("transform");
    currentTransform.setAttribute("translation", currentPosition);
    const currentSphere = document.createElement("sphere");
    currentSphere.setAttribute("radius", "0.008");
    currentShape.appendChild(currentSphere);
    currentShape.setAttribute("id", objectId); // Set object ID for click event association
    currentTransform.appendChild(currentShape);
    cometOrbitContainer.appendChild(currentTransform);
}


// 4. Function to create and append the ball to the comet's orbit
function addBallToCometOrbit(orbitPoints) {
    const scene = document.querySelector('scene');
    if (!scene) {
        console.error("Scene not found");
        return;
    }

    const ballTransform = document.createElement('transform');
    ballTransform.setAttribute('id', 'cometOrbitBall');

    const ballShape = document.createElement('shape');
    const ballAppearance = document.createElement('appearance');
    const ballMaterial = document.createElement('material');
    ballMaterial.setAttribute('diffuseColor', '1 0 0'); // Yellow color for the ball
    ballAppearance.appendChild(ballMaterial);
    ballShape.appendChild(ballAppearance);

    const ballSphere = document.createElement('sphere');
    ballSphere.setAttribute('radius', '0.1'); // Small sphere for the comet ball
    ballShape.appendChild(ballSphere);

    ballTransform.appendChild(ballShape);
    scene.appendChild(ballTransform);

    animateCometBall(orbitPoints);
}

// 5. Function to animate the ball along the comet orbit points
function animateCometBall(orbitPoints) {
    let pointIndex = 0;

    function moveBall() {
        if (pointIndex >= orbitPoints.length) {
            pointIndex = 0; // Loop back to start
        }
        const ballTransform = document.getElementById('cometOrbitBall');
        if (ballTransform) {
            ballTransform.setAttribute('translation', orbitPoints[pointIndex]);
        } else {
            console.error("Ball transform not found");
        }
        pointIndex++;

        requestAnimationFrame(moveBall);
    }
    moveBall();
}

// Process comet data and add to scene
function processCometData(cometData) {
    cometData.forEach(obj => {
        let eccentricity = parseFloat(obj.e);
        let perihelionDistance = parseFloat(obj.q_au_1);
        let inclination = parseFloat(obj.i_deg);
        let omega = parseFloat(obj.w_deg);
        let node = parseFloat(obj.node_deg);
        let tp = parseFloat(obj.tp_tdb);
        let objectId = obj.object_name;

        let semiMajorAxis = calculateSemiMajorAxis(eccentricity, perihelionDistance);
        const cOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);

        // Plot the orbit and the current position in X3D
        createCometeOrbitShape(cOrbitPoints, currentPosition, objectId);
    });
}