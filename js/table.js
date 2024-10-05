// Function to update information in the info table
function updateInfoTable(name, eccentricity, perihelionDistance, inclination, omega, node, tp) {
    document.getElementById('infoName').textContent = name || 'N/A';
    document.getElementById('infoEccentricity').textContent = eccentricity || 'N/A';
    document.getElementById('infoSemiMajorAxis').textContent = perihelionDistance || 'N/A';
    document.getElementById('infoInclination').textContent = inclination || 'N/A';
    document.getElementById('infoOmega').textContent = omega || 'N/A';
    document.getElementById('infoNode').textContent = node || 'N/A';
    document.getElementById('infoTp').textContent = tp || 'N/A';
}
