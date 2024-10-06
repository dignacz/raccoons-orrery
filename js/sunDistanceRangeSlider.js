document.addEventListener('DOMContentLoaded', function () {
  const output = document.getElementById("sunDistanceRangeSliderOutput")

  document.getElementById("sunDistanceRangeSlider").oninput = function() {
    output.innerHTML = this.value
    // send message to later capture and hide elements exceeding this value
    window.postMessage({ type: "sunDistanceRangeSlider", value: this.value }, "*");
  }
})
