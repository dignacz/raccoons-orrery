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
        toggleButton.textContent = turnOff(label);

        toggleButton.addEventListener('click', function(e) {
            const container = document.getElementById(containerId);

            // Change label
            e.target.textContent = isOn(container) ? turnOn(label) : turnOff(label);

            if (container) {
                const isHidden = container.getAttribute('visible') === 'false';
                container.setAttribute('visible', isHidden ? 'true' : 'false');
            }
        });
    }

    // Toggle Asteroids (PHA N)
    setupToggle('toggleAsteroidsPHA', 'asteroidOrbitContainerPHA', 'Toggle Asteroids (PHA Y)');

    // Toggle Asteroids (Non-PHA N)
    setupToggle('toggleAsteroidsNonPHA', 'asteroidOrbitContainerNonPHA', 'Toggle Asteroids (Non-PHA Y)');

    // Toggle Comets
    setupToggle('toggleComets', 'cometOrbitContainer', 'Toggle Comets');
});
