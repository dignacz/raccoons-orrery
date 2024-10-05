// Fetch the JSON data from the external file
fetch('https://raw.githubusercontent.com/dignacz/raccoons-orrery/refs/heads/main/asteroid_query_results.json')
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();  // Parse the JSON data from the response
})
    .then(asteroidData => {
        console.log(asteroidData);  // Now you have access to the JSON data
        // displayData(asteroidData);
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

// Function to create and append orbit and position marker to x3dom scene
function createAsteroidOrbitShape(orbitPoints, currentPosition, objectName, pha = "N") {
    const asteroidOrbitContainer = document.getElementById("asteroidOrbitContainer");
    const asteroidShape = document.createElement("shape");

    const aAppearance = document.createElement("appearance");
    const aMaterial = document.createElement("material");
    if (pha === "Y") {
        aMaterial.setAttribute("emissiveColor", "1 0 0"); // Red color for potentially hazardous asteroids
    } else {
        aMaterial.setAttribute("emissiveColor", "0.30 0.30 0.30"); // Light gray color for non-hazardous asteroids
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
    asteroidOrbitContainer.appendChild(asteroidShape);

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
    currentSphere.setAttribute("radius", "0.008");
    currentShape.appendChild(currentSphere);
    currentTransform.appendChild(currentShape);
    asteroidOrbitContainer.appendChild(currentTransform);
}

// Function to process the JSON data
function processAsteroidData(asteroidData) {
    asteroidData.forEach(obj => {
        const eccentricity = parseFloat(obj.e);
        const semiMajorAxis = parseFloat(obj.a);
        const inclination = parseFloat(obj.i);
        const omega = parseFloat(obj.w);
        const node = parseFloat(obj.om);
        const tp = parseFloat(obj.tp);
        const PHA = obj.pha; // Corrected to retrieve PHA as a string

        // Calculate the orbit points and current position
        const aOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);

        // Plot the orbit and the current position in X3D
        createAsteroidOrbitShape(aOrbitPoints, currentPosition, obj.full_name, PHA);
    });
}