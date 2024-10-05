document.addEventListener('DOMContentLoaded', function () {
    // Toggle Asteroids (PHA N)
    document.getElementById('toggleAsteroidsPHA').addEventListener('click', function() {
        const asteroidContainerPHA = document.getElementById('asteroidOrbitContainerPHA');
        if (asteroidContainerPHA) {
            const isHidden = asteroidContainerPHA.getAttribute('visible') === 'false';
            asteroidContainerPHA.setAttribute('visible', isHidden ? 'true' : 'false');
        }
    });

    // Toggle Asteroids (Non-PHA N)
    document.getElementById('toggleAsteroidsNonPHA').addEventListener('click', function() {
        const asteroidContainerNonPHA = document.getElementById('asteroidOrbitContainerNonPHA');
        if (asteroidContainerNonPHA) {
            const isHidden = asteroidContainerNonPHA.getAttribute('visible') === 'false';
            asteroidContainerNonPHA.setAttribute('visible', isHidden ? 'true' : 'false');
        }
    });

    // Toggle Comets
    document.getElementById('toggleComets').addEventListener('click', function() {
        const cometContainer = document.getElementById('cometOrbitContainer');
        if (cometContainer) {
            const isHidden = cometContainer.getAttribute('visible') === 'false';
            cometContainer.setAttribute('visible', isHidden ? 'true' : 'false');
        }
    });
});
