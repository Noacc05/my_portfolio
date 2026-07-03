
const track = document.querySelector('.carousel-track');
const slides = Array.from(track.children);
const nextButton = document.querySelector('.next-btn');
const prevButton = document.querySelector('.prev-btn');

let currentIndex = 0;

function moveToSlide(index) {
// Moves the track horizontally by 100% per slide
track.style.transform = `translateX(-${index * 100}%)`;
}

nextButton.addEventListener('click', () => {
// If at the last slide, loop back to the first. Otherwise, go to the next.
currentIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
moveToSlide(currentIndex);
});

prevButton.addEventListener('click', () => {
// If at the first slide, loop to the last. Otherwise, go to the previous.
currentIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
moveToSlide(currentIndex);
});