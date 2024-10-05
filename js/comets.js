// Fetch the JSON data from the external file
fetch('https://data.nasa.gov/resource/b67r-rgxc.json')
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();  // Parse the JSON data from the response
})
    .then(cometData => {
        console.log(cometData);  // Now you have access to the JSON data
        processCometData(cometData);
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
        // True anomaly from 0 to 2π (0 to 360 degrees)
        let trueAnomaly = (2 * Math.PI * i) / numPoints;

        // Radius at this point in the orbit
        let r = (semiMajorAxis * (1 - Math.pow(eccentricity, 2))) / (1 + eccentricity * Math.cos(trueAnomaly));

        // Position in the orbital plane (2D)
        let xPrime = r * Math.cos(trueAnomaly);
        let yPrime = r * Math.sin(trueAnomaly);

        // Transform to 3D space using inclination, omega, and node
        let x = xPrime * (Math.cos(nodeRad) * Math.cos(omegaRad) - Math.sin(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad))
                - yPrime * (Math.sin(nodeRad) * Math.cos(omegaRad) + Math.cos(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad));

        let y = xPrime * (Math.sin(nodeRad) * Math.cos(omegaRad) + Math.cos(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad))
                + yPrime * (Math.cos(nodeRad) * Math.cos(omegaRad) - Math.sin(nodeRad) * Math.sin(omegaRad) * Math.cos(inclinationRad));

        let z = xPrime * (Math.sin(omegaRad) * Math.sin(inclinationRad)) + yPrime * (Math.cos(omegaRad) * Math.sin(inclinationRad));

        // Store the calculated (x, y, z) point
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

// 4. Function to create and append comet orbit and position marker to x3dom scene
function createCometOrbitShape(cOrbitPoints, currentPosition, objectName) {
    const cometOrbitContainer = document.getElementById("cometOrbitContainer");

    // Create <shape> element for the orbit
    const cometShape = document.createElement("shape");

    // Set appearance (e.g., line color)
    const cAppearance = document.createElement("appearance");
    const cMaterial = document.createElement("material");
    cMaterial.setAttribute("emissiveColor", "0 0 0.1"); // Light blue color for comets
    cAppearance.appendChild(cMaterial);
    cometShape.appendChild(cAppearance);

    // Create <indexedLineSet> element to hold the orbit line
    const cIndexedLineSet = document.createElement("indexedLineSet");

    // Add coordIndex (this just connects the points in a sequential manner)
    let coordIndex = Array.from({ length: cOrbitPoints.length }, (_, i) => i).join(' ') + " -1"; // "-1" ends the sequence
    cIndexedLineSet.setAttribute("coordIndex", coordIndex);

    // Create <coordinate> element and add calculated points
    const cCoordinate = document.createElement("coordinate");
    cCoordinate.setAttribute("point", cOrbitPoints.join(' '));
    cIndexedLineSet.appendChild(cCoordinate);

    // Append the indexedLineSet to the shape
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
    currentTransform.appendChild(currentShape);
    cometOrbitContainer.appendChild(currentTransform);
}

// Function to process the JSON data
function processCometData(cometData) {
    cometData.forEach(obj => {
        // Parse eccentricity and perihelion distance as floating-point numbers
        let eccentricity = parseFloat(obj.e);
        let perihelionDistance = parseFloat(obj.q_au_1);
        let inclination = parseFloat(obj.i_deg);
        let omega = parseFloat(obj.w_deg);
        let node = parseFloat(obj.node_deg);
        let objectName = obj.object_name;
        let tp = parseFloat(obj.tp_tdb);

        // Calculate semi-major axis for each object
        let semiMajorAxis = calculateSemiMajorAxis(eccentricity, perihelionDistance);
        const cOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);

        // Plot the orbit and the current position in X3D
        createCometOrbitShape(cOrbitPoints, currentPosition, objectName);
    });
}