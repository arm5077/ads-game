var player = d3.select(".player"),
boxSpeed = 1,
movement = { goingLeft: false, goingRight: false },
keys = { key37: "goingLeft", key39: "goingRight", key38: "goingUp", key40: "goingDown" }

d3.select(window).on("keydown", function(){
	console.log("key" + d3.event.keyCode);
	movement[keys["key" + d3.event.keyCode]] = true;
});

d3.select(window).on("keyup", function(){
	movement[keys["key" + d3.event.keyCode]] = false
});


// Overall counter
setInterval(function(){
	
	d3.selectAll(".block")
		.style("top", function(){ 
			return parseInt(d3.select(this).style("top")) - boxSpeed + "px" 
		});
	
	// Get current position of player
	var playerPosition = {
		x1: player.node().offsetLeft,
		x2: player.node().offsetLeft + player.node().offsetWidth,
		y1: player.node().offsetTop,
		y2: player.node().offsetTop + player.node().offsetHeight,
		dx: movement.goingLeft ? -5 : movement.goingRight ? 5 : 0,
		dy: movement.goingUp ? -5 : movement.goingDown ? 5 : 0,
	}
	
	
	// Detect collisions 
	d3.selectAll(".block").each(function(d, i){		
		if( playerPosition.x2 >= this.offsetLeft
			&& playerPosition.x1 <= this.offsetLeft + this.offsetWidth
			&& playerPosition.y1 <= this.offsetTop + this.offsetHeight
			&& playerPosition.y2 >= this.offsetTop ) {
				playerPosition.dy -= boxSpeed
		}
	});
;
	// Update player position
	player.style({
		top: function(){ return Math.max(0, Math.min(window.innerHeight - this.offsetHeight, this.offsetTop + playerPosition.dy)) + "px"},
		left: function(){ return Math.max(0, Math.min(window.innerWidth - this.offsetWidth, this.offsetLeft + playerPosition.dx))  + "px"}
	});
		
}, 20);