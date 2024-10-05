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

// 3. Function to create and append orbit to x3dom scene
function createCometeOrbitShape(cOrbitPoints, objectName) {
    const cometOrbitContainer = document.getElementById("cometOrbitContainer");

    // Create <shape> element for the orbit
    const cometShape = document.createElement("shape");

    // Set appearance (e.g., line color)
    const cAppearance = document.createElement("appearance");
    const cMaterial = document.createElement("material");
    cMaterial.setAttribute("emissiveColor", "0 0 1"); 
    cAppearance.appendChild(cMaterial);
    cometShape.appendChild(cAppearance);

    // Create <indexedLineSet> element to hold the orbit line
    const cIndexedLineSet = document.createElement("indexedLineSet");

    // Add coordIndex (this just connects the points in a sequential manner)
    let coordIndex = Array.from({length: cOrbitPoints.length}, (_, i) => i).join(' ') + " -1"; // "-1" ends the sequence
    cIndexedLineSet.setAttribute("coordIndex", coordIndex);

    // Create <coordinate> element and add calculated points
    const cCoordinate = document.createElement("coordinate");
    cCoordinate.setAttribute("point", cOrbitPoints.join(', ')); // Insert points as "x y z, x y z, ..."
    cIndexedLineSet.appendChild(cCoordinate);

    // Append the indexedLineSet to the shape
    cometShape.appendChild(cIndexedLineSet);

    // Finally, append the shape to the orbitContainer in the x3dom scene
    cometOrbitContainer.appendChild(cometShape);
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
        let objectName = parseFloat(obj.object_name);

        // Calculate semi-major axis for each object
        let semiMajorAxis = calculateSemiMajorAxis(eccentricity, perihelionDistance);
        const cOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);

        createCometeOrbitShape(cOrbitPoints, objectName);

    });
}
