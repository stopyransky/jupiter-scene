// function runTweens() {
//   // experimental
//   var CameraOperator = {
//     panLeft: function(amount, time, easing) {
//       return new TWEEN.Tween(camera.position)
//         .to({ x: '-' + amount }, time)
//         .easing(easing);
//     },

//     panRight: function(amount, time, easing) {
//       return new TWEEN.Tween(camera.position)
//         .to({ x: '+' + amount }, time)
//         .easing(easing);
//     },

//     zoomIn: function() {},
//     zoomOut: function() {},
//     carouselLeft: function() {},
//     carouselRight: function() {},
//     craneTop: function() {},
//     craneBottom: function() {},
//     dollyZoom: function() {},
//     follow: function() {}
//   };

//   var take1 = new TWEEN.Tween({
//     x: camera.position.x,
//     y: camera.position.y,
//     z: camera.position.z
//   })
//     .to({ x: 12, y: 4, z: 5 }, 10000)
//     .easing(TWEEN.Easing.Cubic.InOut)
//     .onUpdate(function() {
//       camera.position.set(this.x, this.y, this.z);
//       camera.lookAt(jupiter.position);
//     })
//     .start();

//   var take2 = new TWEEN.Tween({ x: 12, y: 4, z: 5 }, 10000)
//     .delay(10000)
//     .to({ x: 0.1, y: 15, z: 0.1 }, 10000)
//     .easing(TWEEN.Easing.Cubic.InOut)
//     .onUpdate(function() {
//       camera.position.set(this.x, this.y, this.z);
//       camera.lookAt(jupiter.position);
//     })
//     .start();

//   var take3 = new TWEEN.Tween({ y: 15 })
//     .delay(20000)
//     .to({ y: 30 }, 5000)
//     .easing(TWEEN.Easing.Elastic.InOut)
//     .onUpdate(function() {
//       camera.position.y = this.y;
//       camera.lookAt(jupiter.position);
//     })
//     .start();

//   var take4 = new TWEEN.Tween({ x: 0, y: 30, z: 0 })
//     .delay(25000)
//     .to(
//       {
//         x: callisto.position.x,
//         y: callisto.position.y + 2,
//         z: callisto.position.z
//       },
//       10000
//     )
//     .easing(TWEEN.Easing.Cubic.Out)
//     .onUpdate(function() {
//       camera.position.set(this.x, this.y, this.z);
//       camera.lookAt(jupiter.position);
//     })
//     .start();

//   var carousel = new TWEEN.Tween({ rotation: 0 }, 10000)
//     .delay(35000)
//     .to({ rotation: 2 * Math.PI })
//     .easing(TWEEN.Eeasing.Linear.InOut)
//     .onUpdate(function() {
//       var dist = camera.position.distanceTo(jupiter.position);
//       camera.position.set(dist * Math.cos(rotation), dist * Math.sin(rotation));
//     })
//     .start();
// }
