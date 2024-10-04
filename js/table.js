// Fetch the JSON data from the external file
fetch('https://data.nasa.gov/resource/b67r-rgxc.json')
    .then(response => response.json())  // Parse the JSON data from the response
    .then(data => {
        console.log(data);  // Now you have access to the JSON data
    })
    .catch(error => console.error('Error loading the JSON file:', error));

//IN PROGRESS