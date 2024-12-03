// Dropdown logic
console.log("b");
const dropdownButton = document.getElementById("dropdown-button");
const dropdownMenu = document.getElementById("dropdown-menu");

// Toggle dropdown menu visibility
dropdownButton.addEventListener("click", () => {
  console.log("a");
  dropdownMenu.classList.toggle("hidden");
});

// Close dropdown if clicking outside
document.addEventListener("click", (event) => {
  if (
    !dropdownButton.contains(event.target) &&
    !dropdownMenu.contains(event.target)
  ) {
    dropdownMenu.classList.add("hidden");
  }
});