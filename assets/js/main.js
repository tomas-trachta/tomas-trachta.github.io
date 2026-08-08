document.getElementById("year").textContent = new Date().getFullYear();

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

function openLightbox(src, alt) {
	lightboxImg.src = src;
	lightboxImg.alt = alt;
	lightbox.classList.add("open");
	document.body.classList.add("no-scroll");
}

function closeLightbox() {
	lightbox.classList.remove("open");
	document.body.classList.remove("no-scroll");
	lightboxImg.src = "";
}

document.querySelectorAll(".lightbox-trigger").forEach((img) => {
	img.addEventListener("click", () => openLightbox(img.src, img.alt));
});

lightbox.addEventListener("click", (event) => {
	if (event.target === lightbox || event.target === lightboxClose) {
		closeLightbox();
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		closeLightbox();
	}
});
