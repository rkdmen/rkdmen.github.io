const introText = {};
introText.opacityIn = [0, 1];
introText.scaleIn = [0.2, 1];
introText.scaleOut = 3;
introText.durationIn = 800;
introText.durationOut = 100;
introText.delay = 500;

anime
  .timeline({ loop: true })
  .add({
    targets: ".intro .intro-1",
    opacity: introText.opacityIn,
    scale: introText.scaleIn,
    duration: introText.durationIn,
  })
  .add({
    targets: ".intro .intro-1",
    opacity: 0,
    scale: introText.scaleOut,
    duration: introText.durationOut,
    easing: "easeInExpo",
    delay: introText.delay,
  })
  .add({
    targets: ".intro .intro-2",
    opacity: introText.opacityIn,
    scale: introText.scaleIn,
    duration: introText.durationIn,
  })
  .add({
    targets: ".intro .intro-2",
    opacity: 0,
    scale: introText.scaleOut,
    duration: introText.durationOut,
    easing: "easeInExpo",
    delay: introText.delay,
  })
  .add({
    targets: ".intro",
    opacity: 0,
    duration: 500,
    delay: 100,
  });
