// CometData
fetch('https://data.nasa.gov/resource/b67r-rgxc.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();  // Parse the JSON data from the response
    })
    .then(cometData => {
        console.log(cometData); 
        window.cometData = cometData; // Now you have access to the JSON data
        processCometData(cometData);
    })
    .catch(error => console.error('Error loading the JSON file:', error));

// Degrees to Radians
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// AsteroidData
fetch('https://raw.githubusercontent.com/dignacz/raccoons-orrery/refs/heads/main/asteroid_query_results.json')
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();  // Parse the JSON data from the response
})
    .then(asteroidData => {
        console.log(asteroidData);  // Now you have access to the JSON data
        window.asteroidData = asteroidData; // Store comet data globally for click access
        // displayData(asteroidData);
        processAsteroidData(asteroidData);
    })
    .catch(error => console.error('Error loading the JSON file:', error));

// SLIDER

 // Calculate Julian Centuries for a given date
 function getJulianDate() {
    const date = new Date(Date.UTC(2020, 1, 8, 15));
    return 2451545.0 + (date - new Date(Date.UTC(2000, 0, 1, 12))) / 86400000;
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
    let t = getJulianDate(); // Current time in Julian date
    console.log(t);
    let meanMotion = Math.sqrt(1 / Math.pow(semiMajorAxis, 3));
    let meanAnomaly = meanMotion * (t - tp);
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

// 4. Function to create and append comet orbit and position marker to x3dom scene
function createCometeOrbitShape(cOrbitPoints, currentPosition, objectId) {
    const cometOrbitContainer = document.getElementById("cometOrbitContainer");
    cometOrbitContainer.setAttribute('visible', 'false'); // Ensure it's visible by default

    const cometShape = document.createElement("shape");
    const cAppearance = document.createElement("appearance");
    const cMaterial = document.createElement("material");
    cMaterial.setAttribute("emissiveColor", "0 0 0.1"); // Light blue color for comets
    cAppearance.appendChild(cMaterial);
    cometShape.appendChild(cAppearance);

    const cIndexedLineSet = document.createElement("indexedLineSet");

    // Add coordIndex (this just connects the points in a sequential manner)
    let coordIndex = Array.from({ length: cOrbitPoints.length }, (_, i) => i).join(' ') + " -1"; // "-1" ends the sequence
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
    currentShape.setAttribute("id", objectId);

    const currentTransform = document.createElement("transform");
    currentTransform.setAttribute("translation", currentPosition);
    const currentSphere = document.createElement("sphere");
    currentSphere.setAttribute("radius", "0.008");
    currentShape.appendChild(currentSphere);
    currentTransform.appendChild(currentShape);
    cometOrbitContainer.appendChild(currentTransform);
}

function createAsteroidOrbitShape(orbitPoints, currentPosition, objectId, pha = "N") {
    let asteroidContainerPHA;
    let asteroidContainerNonPHA;

    if (pha === "Y") {
        asteroidContainerPHA = document.getElementById("asteroidOrbitContainerPHA");
        asteroidContainerPHA.setAttribute('visible', 'false'); // Ensure it's visible by default
    } else {
        asteroidContainerNonPHA = document.getElementById("asteroidOrbitContainerNonPHA");
        asteroidContainerNonPHA.setAttribute('visible', 'false'); // Ensure it's visible by default
    }

    const asteroidShape = document.createElement("shape");

    const aAppearance = document.createElement("appearance");
    const aMaterial = document.createElement("material");
    if (pha === "Y") {
        aMaterial.setAttribute("emissiveColor", "1 0 0"); // Red color for potentially hazardous asteroids
    } else {
        aMaterial.setAttribute("emissiveColor", "0.30 0.30 0.30"); // Grey color for non-hazardous asteroids
    }
    aAppearance.appendChild(aMaterial);
    asteroidShape.appendChild(aAppearance);
    asteroidShape.setAttribute("id", objectId); 

    const aIndexedLineSet = document.createElement("indexedLineSet");
    let coordIndex = Array.from({ length: orbitPoints.length }, (_, i) => i).join(' ') + " -1";
    aIndexedLineSet.setAttribute("coordIndex", coordIndex);

    const aCoordinate = document.createElement("coordinate");
    aCoordinate.setAttribute("point", orbitPoints.join(' '));
    aIndexedLineSet.appendChild(aCoordinate);

    asteroidShape.appendChild(aIndexedLineSet);
    if (pha === "Y") {
        asteroidContainerPHA.appendChild(asteroidShape);
    }
    else {
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
    currentShape.setAttribute("id", objectId); 
    currentSphere.setAttribute("radius", "0.008");
    currentShape.appendChild(currentSphere);
    currentTransform.appendChild(currentShape);
    if (pha === "Y") {
        asteroidContainerPHA.appendChild(currentTransform);
    }
    else {
        asteroidContainerNonPHA.appendChild(currentTransform);
    }
}



// Process Comet Data
function processCometData(cometData) {
    cometData.forEach(obj => {
        let eccentricity = parseFloat(obj.e);
        let perihelionDistance = parseFloat(obj.q_au_1);
        let inclination = parseFloat(obj.i_deg);
        let omega = parseFloat(obj.w_deg);
        let node = parseFloat(obj.node_deg);
        let objectName = obj.object_name;
        let tp = parseFloat(obj.tp_tdb);
        let objectId = obj.object_name;

        // Calculate semi-major axis for each object
        let semiMajorAxis = calculateSemiMajorAxis(eccentricity, perihelionDistance);
        const cOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);

        // Plot the orbit and the current position in X3D
        createCometeOrbitShape(cOrbitPoints, currentPosition, objectId);

    });
}

// Process Asteroid Data
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