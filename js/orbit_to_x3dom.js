// Retrieve the orbit points from local storage
const cometOrbitPoints = cOrbitPoints;
const asteroidOrbitPoints = aOrbitPoints;

// Function to create and append orbit to X3DOM scene
function createOrbitShape(orbitPoints, objectName, type) {
    const orbitContainer = type === "comet" ? document.getElementById("cometOrbitContainer") : document.getElementById("asteroidOrbitContainer");
    const orbitShape = document.createElement("shape");

    const indexedLineSet = document.createElement("indexedLineSet");
    let coordIndex = Array.from({ length: orbitPoints.length }, (_, i) => i).join(' ') + " -1";
    indexedLineSet.setAttribute("coordIndex", coordIndex);

    const coordinate = document.createElement("coordinate");
    coordinate.setAttribute("point", orbitPoints.join(' '));
    indexedLineSet.appendChild(coordinate);

    // Add color element to set orbit color
    const colorNode = document.createElement("color");
    if (type === "comet") {
        colorNode.setAttribute("color", "1 0 0"); // Red color for comets
    } else if (type === "asteroid") {
        colorNode.setAttribute("color", "0 0 1"); // Blue color for asteroids
    }
    indexedLineSet.appendChild(colorNode);

    orbitShape.appendChild(indexedLineSet);
    orbitContainer.appendChild(orbitShape);

    // Reload the X3DOM scene to make sure it renders
    x3dom.reload();
}


// Create orbits for comets and asteroids
createOrbitShape(cometOrbitPoints, "Comet", "comet");
createOrbitShape(asteroidOrbitPoints, "Asteroid", "asteroid");
