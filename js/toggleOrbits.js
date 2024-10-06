document.addEventListener('DOMContentLoaded', function () {
    function getIsOn(element) {
      return element.getAttribute('visible') === 'false';
    }
    function turnOn(label) {
      return label + ' ON';
    }
    function turnOff(label) {
      return label + ' OFF';
    }

    function setupToggle(toggleButtonId, containerId, label) {
        const toggleButton = document.getElementById(toggleButtonId);

        toggleButton.textContent = turnOn(label);

        toggleButton.addEventListener('click', function(e) {
            const container = document.getElementById(containerId);
            const isOn = getIsOn(container);

            // Change label
            e.target.textContent = isOn ? turnOn(label) : turnOff(label);
            
            window.postMessage({ type: 'toggleOrbits', value: { containerId, isOn } }, '*');
        });
    }

    // Toggle Asteroids (PHA N)
    setupToggle('toggleAsteroidsPHA', 'asteroidOrbitContainerPHA', 'Toggle Asteroids (PHA Y)');

    // Toggle Asteroids (Non-PHA N)
    setupToggle('toggleAsteroidsNonPHA', 'asteroidOrbitContainerNonPHA', 'Toggle Asteroids (Non-PHA Y)');

    // Toggle Comets
    setupToggle('toggleComets', 'cometOrbitContainer', 'Toggle Comets');

    // Toggle Planets
    setupToggle('togglePlanets', 'planetOrbitContainer', 'Toggle Planets');
});
