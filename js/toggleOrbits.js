document.addEventListener('DOMContentLoaded', function () {
    function isOn(element) {
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

        const container = document.getElementById(containerId);

        // Set initial state if not already set
        if (!container.hasAttribute('data-is-hidden')) {
            container.setAttribute('data-is-hidden', 'true'); // Default hidden
        }

        toggleButton.textContent = turnOff(label);

        toggleButton.addEventListener('click', function(e) {
            const container = document.getElementById(containerId);

            // Change label
            e.target.textContent = isOn(container) ? turnOn(label) : turnOff(label);

            if (container) {
                const isHidden = container.getAttribute('visible') === 'false';
                // Toggle visibility
            container.setAttribute('visible', isHidden ? 'true' : 'false');
            container.setAttribute('data-is-hidden', isHidden ? 'false' : 'true');
            }
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
