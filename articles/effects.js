// =========================================================
// ArabAiHub - Visual Effects Activation Script
// ده اللي بيشغّل تأثير الظهور التدريجي أثناء التمرير (.reveal)
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
  const revealElements = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target); // يشتغل مرة واحدة بس لكل عنصر
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((el) => observer.observe(el));
});
