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

// 1. Function to calculate the orbit points
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

// // 2. Function to create and append orbit to x3dom scene
// function createOrbitShape(aOrbitPoints, objectName) {
//     const asteroidOrbitContainer = document.getElementById("asteroidOrbitContainer");

//     // Create <shape> element for the orbit
//     const asteroidShape = document.createElement("shape");

//     // Set appearance (e.g., line color)
//     const aAppearance = document.createElement("appearance");
//     const aMaterial = document.createElement("material");
//     aMaterial.setAttribute("emissiveColor", "0 0 1"); // Blue color
//     aAppearance.appendChild(aMaterial);
//     asteroidShape.appendChild(aAppearance);

//     // Create <indexedLineSet> element to hold the orbit line
//     const aIndexedLineSet = document.createElement("indexedLineSet");

//     // Add coordIndex (this just connects the points in a sequential manner)
//     let coordIndex = Array.from({length: aOrbitPoints.length}, (_, i) => i).join(' ') + " -1"; // "-1" ends the sequence
//     aIndexedLineSet.setAttribute("coordIndex", coordIndex);

//     // Create <coordinate> element and add calculated points
//     const aCoordinate = document.createElement("coordinate");
//     aCoordinate.setAttribute("point", aOrbitPoints.join(', ')); // Insert points as "x y z, x y z, ..."
//     aIndexedLineSet.appendChild(aCoordinate);

//     // Append the indexedLineSet to the shape
//     asteroidShape.appendChild(aIndexedLineSet);

//     // Finally, append the shape to the orbitContainer in the x3dom scene
//     asteroidOrbitContainer.appendChild(asteroidShape);
// }


// Function to process the CSV data
function processAsteroidData(asteroidData) {
   
     asteroidData.forEach(obj => {
        const eccentricity = parseFloat(obj.e);
        const perihelionDistance = parseFloat(obj.q);
        const semiMajorAxis = parseFloat(obj.a);
        const inclination = parseFloat(obj.i);
        const omega = parseFloat(obj.w);
        const node = parseFloat(obj.om);

        // Here you'd calculate the orbit points and plot them, like in the previous example
        const aOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        createOrbitShape(aOrbitPoints, obj.full_name); // Plot the orbit in X3D
    });
}