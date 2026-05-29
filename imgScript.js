const themeToggle = document.querySelector(".theme-toggle");
const promptInput = doucument.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");

const examplePrompts =[ 
"A magic forest with glowing plants and fairy homes among giant mushrooms",
"An old steampunk airship floating through golden clouds at sunset",
"A future Mars colony with glass domes and gardens against red mountains",
"A dragon sleeping on gold coins in a crystal cave",
"An underwater kingdom wih merpeople and glowing coral buildings",
"A floating island with waterfalls pouring into clouds below",
"A witch's cottage in fall with magic herbs in the garden",
"A robot painting in a sunny studio with art supplies around it",
"A magical libary with floating glowing books and spiral staircases",
"A Japanese shrine during cherry blossom season with lanterns and misty mountains",


];

// Set theme based on saved prefrence or default
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
document.body.classList.toggle("dark-theme",isDarkTheme);
themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

//Switch themessss
const toggleTheme = () => {
 const isDarkTheme =  document.body.classList.toggle("dark-theme");
 localstorage.setItem("theme",isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};
// Gives random example in prompt input 
promptBtn.addEventListener("click",() => {
    const prompt = examplePrompts[Math.floor(Math.random()* examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
 })



themeToggle.addEventListener("click",toggleTheme);