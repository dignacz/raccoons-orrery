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
        initializeGlobalData('cometData', cometData, processCometData);
        renderComets();
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
        initializeGlobalData('asteroidData', asteroidData, processAsteroidData);
        renderAsteroids();
    })
    .catch(error => console.error('Error loading the JSON file:', error));

// PlanetData
fetch('https://raw.githubusercontent.com/dignacz/raccoons-orrery/refs/heads/good-morning-pineapple/planets_data.json')
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();  // Parse the JSON data from the response
})
.then(planetData => {
    console.log(planetData);  // Now you have access to the JSON data
    initializeGlobalData('planetData', planetData, processPlanetData);
    renderPlanets();
})
.catch(error => console.error('Error loading the JSON file:', error));

function initializeGlobalData(key, data, processFn) {
  window[key] = data;
  window[`${key}Processed`] = processFn(data)

  window[`${key}Processed`].forEach(obj => {
    obj.rendered = false;
    obj.hidden = true;
  })
}

// SLIDER
let sliderValue = 0; // Declare a global variable

document.addEventListener("DOMContentLoaded", function() {
    var output = document.getElementById("demo");
    var slider = document.getElementById("date-slider");

    // Set default value for output and global slider value
    sliderValue = slider.value;
    output.innerHTML = sliderValue;

    slider.oninput = function() {
        var value = (this.value - this.min) / (this.max - this.min) * 100;

        this.style.background = 'linear-gradient(to right, #6b8dff 0%, #ff2a5f ' + value + '%, #fff ' + value + '%, #fff 100%)';

        sliderValue = this.value; // Update the global variable
        output.innerHTML = sliderValue;
        //console.log(sliderValue);

        updateDate();
        processCometData(cometData);
        processAsteroidData(asteroidData);
        processPlanetData(planetData);
    };
});

 //JULIAN DATE - GREGORIAN DATE CONVERTER

 function julianToGregorian(julianDate) {
    const J1970 = 2440587.5;
    const dayMilliseconds = 86400000;
    const date = new Date((julianDate - J1970) * dayMilliseconds);
    return date.toISOString().split('T')[0];
}

function updateDate() {
    const slider = document.getElementById("date-slider");
    const output = document.getElementById("demo");
    const gregorianDate = julianToGregorian(parseFloat(slider.value));
    output.textContent = gregorianDate;
}

window.onload = function() {
    updateDate(); // Initialize with current slider value
};

// 1. Function to calculate semi-major axis
function calculateSemiMajorAxis(e, q) {
    if (e >= 1) {
        return Infinity; // For parabolic or hyperbolic orbits
    }
    return q / (1 - e);  // Semi-major axis formula
}

// Eccentricity RAD to DEG (PLANETS ONLY)

function convertEccentricityRadToDeg(eccentricityRad) {
    const degrees = eccentricityRad * (180 / Math.PI);
    return degrees;
  }

// Argument of Perihelion (PLANETS ONLY)
  function calculateArgumentOfPerihelion(perihelionLongitudeDeg, ascendingNodeLongitudeDeg) {
    const argumentOfPerihelion = perihelionLongitudeDeg - ascendingNodeLongitudeDeg;
    return argumentOfPerihelion;
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
    let t = sliderValue; // Current time in Julian date
    //console.log(t);
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
function createCometeOrbitShape({cOrbitPoints, currentPosition, objectId, semiMajorAxis}) {
    const cometOrbitContainer = document.getElementById("cometOrbitContainer");

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

    // add semiMajorAxis as metadata for the distance to be able to filter by it
    currentShape.setAttribute("data-distance", semiMajorAxis)

    const currentTransform = document.createElement("transform");
    currentTransform.setAttribute("translation", currentPosition);
    const currentSphere = document.createElement("sphere");
    currentSphere.setAttribute("radius", "0.008");
    currentShape.appendChild(currentSphere);
    currentTransform.appendChild(currentShape);
    cometOrbitContainer.appendChild(currentTransform);
}

function createAsteroidOrbitShape({orbitPoints, currentPosition, objectId, pha = "N", semiMajorAxis}) {
    let asteroidContainerPHA;
    let asteroidContainerNonPHA;

    if (pha === "Y") {
        asteroidContainerPHA = document.getElementById("asteroidOrbitContainerPHA");
    } else {
        asteroidContainerNonPHA = document.getElementById("asteroidOrbitContainerNonPHA");
    }

    const asteroidShape = document.createElement("shape");

    const aAppearance = document.createElement("appearance");
    const aMaterial = document.createElement("material");
    if (pha === "Y") {
        aMaterial.setAttribute("emissiveColor", "1 0 0"); // Red color for potentially hazardous asteroids
    } else {
        aMaterial.setAttribute("emissiveColor", "0.15 0.15 0.15"); // Grey color for non-hazardous asteroids
    }

    aAppearance.appendChild(aMaterial);
    asteroidShape.appendChild(aAppearance);
    asteroidShape.setAttribute("id", objectId); 

    // add semiMajorAxis as metadata for the distance to be able to filter by it
    asteroidShape.setAttribute("data-distance", semiMajorAxis)

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

    // add semiMajorAxis as metadata for the distance to be able to filter by it
    currentShape.setAttribute("data-distance", semiMajorAxis)

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

 function createPlanetOrbitShape({pOrbitPoints, currentPosition, objectId}) {
    const planetOrbitContainer = document.getElementById("planetOrbitContainer");

    // Set visibility based on the current state
    const isHiddenPlanet = planetOrbitContainer.getAttribute('data-is-hidden') === 'true';
    if (!isHiddenPlanet) {
        planetOrbitContainer.setAttribute('visible', 'true');
    } else {
        planetOrbitContainer.setAttribute('visible', 'false');
    }

    const planetShape = document.createElement("shape");
    const pAppearance = document.createElement("appearance");
    const pMaterial = document.createElement("material");
    pMaterial.setAttribute("emissiveColor", "0.75 0.75 0.75"); // Darker color for planets
    pAppearance.appendChild(pMaterial);
    planetShape.appendChild(pAppearance);

    const pIndexedLineSet = document.createElement("indexedLineSet");

    // Add coordIndex (this just connects the points in a sequential manner)
    let coordIndex = Array.from({ length: pOrbitPoints.length }, (_, i) => i).join(' ') + " -1"; // "-1" ends the sequence
    pIndexedLineSet.setAttribute("coordIndex", coordIndex);

    const pCoordinate = document.createElement("coordinate");
    pCoordinate.setAttribute("point", pOrbitPoints.join(' '));
    pIndexedLineSet.appendChild(pCoordinate);

    planetShape.appendChild(pIndexedLineSet);
    planetOrbitContainer.appendChild(planetShape);

    // Create a sphere to mark the current position of the planet
    const currentShape = document.createElement("shape");
    const currentAppearance = document.createElement("appearance");
    const currentMaterial = document.createElement("material");
    currentMaterial.setAttribute("diffuseColor", "0.87 0.49 0.0"); // Orange color for the current position marker
    currentAppearance.appendChild(currentMaterial);
    currentShape.appendChild(currentAppearance);
    currentShape.setAttribute("id", objectId);

    const currentTransform = document.createElement("transform");
    currentTransform.setAttribute("translation", currentPosition);
    const currentSphere = document.createElement("sphere");
    currentSphere.setAttribute("radius", "0.02"); // Bigger radius for planets
    currentShape.appendChild(currentSphere);
    currentTransform.appendChild(currentShape);
    planetOrbitContainer.appendChild(currentTransform);
}



// Process Comet Data
function processCometData(data) {
    return data.map(obj => {
        let eccentricity = parseFloat(obj.e);
        let perihelionDistance = parseFloat(obj.q_au_1);
        let inclination = parseFloat(obj.i_deg);
        let omega = parseFloat(obj.w_deg);
        let node = parseFloat(obj.node_deg);
        //let objectName = obj.object_name;
        let tp = parseFloat(obj.tp_tdb);
        let objectId = obj.object_name;
       //console.log(obj);

        // Calculate semi-major axis for each object
        let semiMajorAxis = calculateSemiMajorAxis(eccentricity, perihelionDistance);
        const cOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);
        
        return {cOrbitPoints, currentPosition, objectId, semiMajorAxis};
      

        // Check if comet already exists and clear previous position
        const existingComet = document.getElementById(objectId);
        if (existingComet) {
            existingComet.remove();
        }

        // Plot the orbit and the current position in X3D
        /* createCometeOrbitShape(cOrbitPoints, currentPosition, objectId, semiMajorAxis); */

    });
}

function updateDataBySunProximity(obj, sunDistanceRangeSliderValue) {
  if (obj.semiMajorAxis > sunDistanceRangeSliderValue) {
    obj.hidden = true;
    obj.rendered = false;
  } else {
    obj.hidden = false;
  }
}

function removeElementsBySunProximity(shape, sunDistanceRangeSliderValue) {
  const distance = parseFloat(shape.getAttribute("data-distance"));
  if (distance > sunDistanceRangeSliderValue) {
    shape.remove();
  }
}

function removeObjectsBySunProximity(distance) {
  window.cometDataProcessed.forEach(obj => updateDataBySunProximity(obj, distance));
  window.asteroidDataProcessed.forEach(obj => updateDataBySunProximity(obj, distance));

  // Delete comet elements exceeding the distance
  document.querySelectorAll("#cometOrbitContainer shape").forEach(
    shape => removeElementsBySunProximity(shape, distance)
  );

  // Delete asteroid elements exceeding the distance
  document.querySelectorAll("#asteroidOrbitContainerPHA shape, #asteroidOrbitContainerNonPHA shape").forEach(
    shape => removeElementsBySunProximity(shape, distance)
  );

}

// read message and hide elements exceeding the value
window.addEventListener("message", function(event) {
  const { type, value } = event.data;
  switch (type) {
    case "sunDistanceRangeSlider":
      handleSunDistanceRangeSlider(value);
      break;

    case "toggleOrbits":
      handleToggleOrbits(value);
      break;
    
    default:
      alert("Invalid message type");
  }
});


function handleSunDistanceRangeSlider(value) {
  removeObjectsBySunProximity(value);
  renderAsteroids()
  renderComets();
}

function handleToggleOrbits(value) {
  const { containerId, isOn } = value;
  
  function toggleOrbits(obj) {
    return obj.hidden = !isOn; 
  }
  
  switch (containerId) {
    case "asteroidOrbitContainerPHA":
      window.asteroidDataProcessed.forEach(toggleOrbits);
      renderAsteroids();
      break;

    case "asteroidOrbitContainerNonPHA":
      window.asteroidDataProcessed.forEach(toggleOrbits);
      renderAsteroids();
      break;

    case "cometOrbitContainer":
      window.cometDataProcessed.forEach(toggleOrbits);
      renderComets();
      break;
  }
}


// Process Asteroid Data
function processAsteroidData(data) {
    return data.map(obj => {
        const eccentricity = parseFloat(obj.e);
        const semiMajorAxis = parseFloat(obj.a);
        const inclination = parseFloat(obj.i);
        const omega = parseFloat(obj.w);
        const node = parseFloat(obj.om);
        const tp = parseFloat(obj.tp);
        const PHA = obj.pha; // Corrected to retrieve PHA as a string
        const objectId = obj.full_name;
        //console.log(obj);

        // Calculate the orbit points and current position
        const aOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);
        //console.log(currentPosition);

        // Check if comet already exists and clear previous position
        const existingAsteroid = document.getElementById(objectId);
        if (existingAsteroid) {
            existingAsteroid.remove();
        }

        return {aOrbitPoints, currentPosition, objectId, PHA, semiMajorAxis};
        // Plot the orbit and the current position in X3D
        /* createAsteroidOrbitShape(aOrbitPoints, currentPosition, objectId, PHA, semiMajorAxis); */
    });
}

// Process Planet Data
function processPlanetData(planetData) {
    planetData.forEach(obj => {
        const eccentricity = parseFloat(obj.e_rad);
        const semiMajorAxis = parseFloat(obj.a_au);
        const inclination = parseFloat(obj.I_deg);
        const longperi = parseFloat(obj.long_peri_deg);
        const node = parseFloat(obj.long_node_deg);
        const omega = longperi - node;
        const tp = parseFloat(obj.tp_julian);
        const objectId = obj.name;
        //console.log(obj);

        // Calculate the orbit points and current position
        const pOrbitPoints = calculateOrbitPoints(eccentricity, semiMajorAxis, inclination, omega, node);
        const currentPosition = calculateCurrentPosition(eccentricity, semiMajorAxis, inclination, omega, node, tp);

        // Check if comet already exists and clear previous position
        const existingPlanet = document.getElementById(objectId);
        if (existingPlanet) {
            existingPlanet.remove();
        }

        // Plot the orbit and the current position in X3D
        createPlanetOrbitShape(pOrbitPoints, currentPosition, objectId);
        
    });
}

function renderAsteroids() {
  window.asteroidDataProcessed.forEach(obj => {
    if (!obj.rendered && !obj.hidden) {
      createAsteroidOrbitShape(obj);
      obj.rendered = true;
    }
  })
}

function renderComets() {
  window.cometDataProcessed.forEach(obj => {
    if (!obj.rendered && !obj.hidden) {
      createCometeOrbitShape(obj);
      obj.rendered = true;
    }
  })
}

function renderPlanets() {
  window.planetDataProcessed.forEach(obj => {
    if (!obj.rendered && !obj.hidden) {
      createPlanetOrbitShape(obj);
      obj.rendered = true;
    }
  })
}
