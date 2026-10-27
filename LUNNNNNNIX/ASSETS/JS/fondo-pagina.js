/* Carrusel de imágenes de fondo para Aprender, Juegos y Videos */
(function () {
  const im = ["lenny-kuhne-jHZ70nRk7Ns-unsplash.jpg","dan-farrell-fT49QnFucQ8-unsplash.jpg","jessica-kantak-bailey-WMCvwBTWSi0-unsplash.jpg","kris-mikael-krister-aGihPIbrtVE-unsplash.jpg","look-studio-HtXyytr9304-unsplash.jpg"];
  const c = document.createElement("div"); c.className = "carrusel-inicio"; c.setAttribute("aria-hidden", "true");
  c.innerHTML = im.map(n => "<div style=\"background-image:url('ASSETS/Imagenes/" + n + "')\"></div>").join("");
  document.body.prepend(c);
})();
