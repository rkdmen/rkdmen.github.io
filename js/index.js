console.log("hello");
const emojis = document.querySelector(".favorites");
setTimeout(() => {
  Velocity(
    {
      translateX: "320px",
      // backgroundColor: ["#222", "#043d99"],
    },
    {
      easing: [1000, 20],
      duration: 2000,
    }
  );
}, 100);
