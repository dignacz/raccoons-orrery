document.addEventListener('DOMContentLoaded', function () {
  const output = document.getElementById("sunDistanceRangeSliderOutput")
  document.getElementById("sunDistanceRangeSlider").oninput = function() {
    output.innerHTML = this.value
  }
})
