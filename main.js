document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("container");
    const overlayCon = document.getElementById("overlayCon");
    const overlayBtn = document.getElementById("overlayBtn");

    if (overlayBtn) {
        overlayBtn.addEventListener("click", () => {
            container.classList.toggle("right-panel-active");

            overlayBtn.classList.remove("btnScaled");
            window.requestAnimationFrame(() => {
                overlayBtn.classList.add("btnScaled");
            });
        });
    }
});
