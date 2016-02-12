var player = d3.select(".player"),
points = 0,
movement = { 
	goingLeft: false, 
	goingRight: false 
},
annoyance = {},
distanceTraveled = 0,
totalDistance = 200000,
speed = {}
penalties = {
	collision: 3,
	boundary: 5,
	slowmo: 1
},
times = {
	start: "2016-01-30T20:30:00Z",
	end: "2016-01-31T23:59:59Z",
	gridStart: "2016-01-30T20:30:00Z"
}

keys = { 
	key37: "goingLeft", 
	key39: "goingRight", 
	key38: "goingUp", 
	key40: "goingDown" 
}, 
messages = [

]
grid = [],
networks = [],
collisions = {},
obj = {},

started = false,
lost = false,
finished = false,
y=null,
x=null, 
slowmo = false;



if( window.innerWidth <= 700 )
	var resolution = "tablet";

if( window.innerWidth <= 500 )	
	var resolution = "mobile";

		
console.log(resolution)

if( resolution == "mobile")
	totalDistance = 100000;

// Set up keypress events
d3.select(window).on("keydown", function(){
	// If spacebar
	if( d3.event.keyCode == 32){
		speed.current = speed.low;
		slowmo = true;
	}	
	else
		// If movement key
		movement[keys["key" + d3.event.keyCode]] = true;
});

d3.select(window).on("keyup", function(){
	// If spacebar
	if( d3.event.keyCode == 32){
		speed.current = speed.high;
		slowmo = false;
	}
	else
		// If movement key
		movement[keys["key" + d3.event.keyCode]] = false
});


d3.selectAll(".control").on("touchstart", function(){
	console.log("boooo");
	if( d3.select(this).attr("class").indexOf("left") != -1 )
		movement[keys["key37"]] = true;
	else 
		movement[keys["key39"]] = true;
})

d3.selectAll(".control").on("touchend", function(){
	if( d3.select(this).attr("class").indexOf("left") != -1 )
		movement[keys["key37"]] = false;
	else 
		movement[keys["key39"]] = false;

})

// 
// Do intro stuff

// Center titlecard
centerTitlecard();

// Center player
d3.select(".player")
	.style("left", ( window.innerWidth - d3.select(".player").node().offsetWidth ) / 2 + "px")
	.style("top", ( window.innerHeight - d3.select(".player").node().offsetHeight ) / 2 + "px")

// Get data
d3.json("data/sponsors.json", function(err, sponsors){
	if( err ) throw err;

	d3.json("data/large-iowa.min.json", function(err, ads){
		if( err ) throw err;

		// Button-clicking event
		d3.selectAll(".button").on("click", function(){
			
			if(d3.select(this).attr("show"))
				switchTitlecard(d3.select(this).attr("show"));

			if( d3.select(this).attr("id") == "start" || d3.select(this).attr("id") == "fullscreen" ){
				
				if(d3.select(this).attr("id") == "fullscreen" && screenfull.enabled)		
					screenfull.request();
					
				annoyance.current = 0;
				d3.select(".titlecard").classed("hidden", true);
				startGame();
			}
				
			
		});

		// Build game
		initialize();
		
		// Overall game loop
		setInterval(function(){

			// Set player speed dynamically
			if( resolution == "mobile" )
				playerSpeed = 5;
			else
				playerSpeed = .004 * window.innerWidth;
			
			// Recharge annoyance/patience
			if(annoyance.current > 0)
				annoyance.current -= .2
			
			// Add to total distance
			if(started)
				distanceTraveled += speed.current;

			// check message
			messages.forEach(function(message){
				if( distanceTraveled >= Math.abs(y(new Date(message.time))) && distanceTraveled <= Math.abs(y(new Date(message.time))) + 50 ){
					showPopup(message.message);
				}
					
			});

			// Check to see if they're run out of patience
//			console.log(moment(y.invert(distanceTraveled)).toDate());
//			console.log(moment(times.start).toDate());
			if( annoyance.current >= annoyance.max ){
				lost = true;
				finishGame();
			}

			// Acceleration portion
			// Replaced with stepped acceleration?
			if( started){
				if( !slowmo )
					speed.current *= 1.0001;

				speed.high *= 1.0001;
			}
			
			// Move ads
			ads.forEach(function(ad, i){
				ad.y += speed.current;
			});

			// Move gridlines
			grid.forEach(function(line){
				line.y += speed.current;
			});


			[{ data: grid, tag: "line" },{ data: ads, tag: "block" }].forEach(function(data){
				var selection = data.data.filter(function(d){
					return (d.y > -200 && d.y <= window.innerHeight + 200)
				})
				
				obj[data.tag] = d3.select("body").selectAll("." + data.tag)
					.data(selection, function(d){ if(d) return d.y });
				
				// Add new object
				if( data.tag == "line" ){
					var newObj = obj[data.tag].enter()
					.append("div")
						.attr("class", data.tag)
						.style("top", function(d){ return d.y + "px" })

					newObj.append("div")
						.attr("class", "left")
						.text(function(d){ return d.time });

					newObj.append("div")
						.attr("class", "right")
						.text(function(d){ return d.date });

				}
				else {
					// Add new objects
					var newObj = obj[data.tag].enter()
					.append("div")
						.attr("class", function(d){
							if(d.lastName)
								return "block " + d.party;
							else 
								return "block pac " + d.party;
						})
						.attr("id", function(d){ return d.id })
						.style({
							width: 100 / networks.length + "%",
							height: function(d){ return Math.abs(y(d.end_time) - y(d.start_time)) + "px"; },
							top: function(d){ return d.y + "px" },
							left: function(d){ return d.x + "px" }
						});

					newObj.append("span")
						.classed("text", true)
						.style("line-height", function(d){ return Math.abs(y(d.end_time) - y(d.start_time)) + "px"; })
						.text("Super PAC");

					newObj.append("img")
						.classed("portrait", true)
				}
			
				// Remove old objects
				obj[data.tag].exit().remove()

				// Move all the grids that are still standing
				obj[data.tag].style("top", function(d){ 
					return d.y + "px"
				});				
			});

			
			// Get current position of player
			var playerPosition = {
				x1: player.node().offsetLeft,
				x2: player.node().offsetLeft + player.node().offsetWidth,
				y1: player.node().offsetTop,
				y2: player.node().offsetTop + player.node().offsetHeight,
				dx: movement.goingLeft ? -playerSpeed : movement.goingRight ? playerSpeed : 0,
				dy: movement.goingUp ? -playerSpeed : movement.goingDown ? playerSpeed : 0,
			}



			// Drift person up
			if( resolution == "mobile" || resolution == "tablet"){
					if( (playerPosition.y1 + playerPosition.y2) / 2 > window.innerHeight / 5 * 4)
						playerPosition.dy = -playerSpeed
			}
			else {
				if( (playerPosition.y1 + playerPosition.y2) / 2 > window.innerHeight / 3 * 2)
					playerPosition.dy = -playerSpeed	
			}
		


			// Penalize player if in the bottom of the screen
			if( playerPosition.y2 >= window.innerHeight * .95 && started ){
				annoyance.current += penalties.boundary;
				d3.select(".danger-zone")
					.classed("flashing", true)
			}
			else {
				d3.select(".danger-zone")
					.classed("flashing", false)
			}
				
			// Penalize player if slowmo
			if( slowmo ){
				annoyance.current += penalties.slowmo;
			}
				

			// Turn portraits toward the player
			obj.block.select(".portrait")
				.attr("src", function(d){ 
					if( d.lastName ){
						if( playerPosition.x1 >= this.parentElement.offsetLeft )
							return "img/" + d.lastName.toLowerCase() + "-color-right.jpg"; 
						else
							return "img/" + d.lastName.toLowerCase() + "-color-left.jpg";
					}
				})
				.style("width", function(d){ return d3.min([this.parentElement.offsetHeight, this.parentElement.offsetWidth]) * .8 + "px"})
				.style("margin-top", function(d){ return (this.parentElement.offsetHeight - this.offsetHeight) / 2 + "px"})

			// See if there's been collision with a block
			var collision = false;
			if(started){
				obj.block.each(function(d, i){		
					if( playerPosition.x2 >= this.offsetLeft
						&& playerPosition.x1 <= this.offsetLeft + this.offsetWidth
						&& playerPosition.y1 <= this.offsetTop + this.offsetHeight
						&& playerPosition.y2 >= this.offsetTop ) {
							collision = true
							// Add to collision object
							collisions[d.id] = "yes";
					}
				});

				// If there's been a collision
				if( collision ){
					

					// Carry the player along if they're not moving
					if( playerPosition.dy == 0 )
						playerPosition.dy += speed.current 
					else {
						// Negate the player's speed if they're moving
						if( playerPosition.dy > 0)
							playerPosition.dy = playerSpeed + speed.current * 1.2;
						else
							playerPosition.dy = -playerSpeed + speed.current * 1.2;
					}

					// Stunt horizontal speed
					if( playerPosition.dx > 0 )
						playerPosition.dx = playerSpeed / 2;
					if( playerPosition.dx < 0 )
						playerPosition.dx = -playerSpeed / 2;
						
					// Add to annoyance
					annoyance.current += penalties.collision;
				}
			}
			
			// Update annoyance
			
			if( resolution == "tablet")
				annoyance.steps = 6;
			if( resolution == "mobile")
				annoyance.steps = 3;
			var facesArray = [];
			for( i = 0; i <= annoyance.max; i = i + annoyance.max / annoyance.steps){
				if(annoyance.current <= i){
					facesArray.push("smiley");
				}
				else
					facesArray.push("frownie");
			}
			var faces = d3.select(".annoyance").selectAll(".face")
				.data(facesArray);

			faces.enter().append("img")
				.attr("class", "face");
				
			faces.attr("src", function(d){ return "img/" + d + ".png"});
			
			

			// Update player position
			if( started ){
				player.style({
					top: function(){ return Math.max(0, Math.min(window.innerHeight - this.offsetHeight, this.offsetTop + playerPosition.dy)) + "px"},
					left: function(){ return Math.max(0, Math.min(window.innerWidth - this.offsetWidth, this.offsetLeft + playerPosition.dx))  + "px"}
				});
			}
			
			
			// Update HUD
			d3.select(".progress .number").text( Math.round( distanceTraveled/totalDistance * 100 ) );

		}, 20);

		function startGame(){
			times.start = "2016-01-31T00:00:00Z";
			times.end = "2016-01-31T23:00:00Z";
			times.gridStart = "2016-01-30T20:30:00Z";
			
			speed.current = 0;
			
			if( resolution == "mobile" || resolution == "tablet" )
				d3.select(".controls").classed("hidden", false)
			
			setTimeout(function(){
				d3.select(".player").classed("shrinking", true);
				
				if( resolution == "mobile" || resolution == "tablet")
					var top = window.innerHeight / 5 * 4 + "px"
				else 
					var top = window.innerHeight / 3 * 2 + "px"
				
				d3.select(".player")
					.style("height", window.innerHeight * .08 + "px")
					.style("width", window.innerHeight * .08 + "px")
					.style("left", ( window.innerWidth - (window.innerHeight * .08) ) / 2 + "px")
					.style("top", top)
					
					setTimeout(function(){
						d3.select(".player").classed("shrinking", false);
						started = true;
						initialize();
					}, 250);

			}, 500)

		}

		function initialize(){
			
			grid = [],
			networks = [],
			collisions = {},
			obj = {},
			points = 0;
			
			speed = {
				current: 8,
				high: 8,
				low: 5 
			};
			
			annoyance = {
				current: 0,
				max: 1000,
				steps: 10
			};
			
			distanceTraveled = 0;

			// Set box speed to default
			speed.current = speed.high;

			// Generate list of networks
			ads.forEach(function(ad){
				networkIndex = networks.map(function(d){ return d.network}).indexOf(ad.network)
				if( networkIndex == -1 )
					networks.push({ network: ad.network });	
			});
		
			// Reduce amount on mobile
			if( resolution == "mobile"){
				console.log("mobile")
				networks = networks.splice(0,4);
			 	ads = ads.filter(function(ad){
					if( networks.map(function(d){ return d.network }).indexOf(ad.network) == -1)
						return false;
					else return true;
				});
			}

				
			

			// Make positioning scales
			y = d3.time.scale.utc()
				.domain([ new Date(times.end), new Date(times.start)])
//				.range([-200 * window.innerHeight, 0]);
				.range([-totalDistance, 0])
				
			x = d3.scale.ordinal()
				.domain(shuffle(networks.map(function(d,i){ return d.network })))
				.rangePoints([0, window.innerWidth]);

			// Build footer
			d3.select(".footer").selectAll(".network")
				.data(networks).enter()
			.append("div")
				.attr("class", "network")
				.style("left", function(d){ return x(d.network) + "px"; })
				.style("width", 100 / networks.length + "%")
				.text(function(d){ return d.network });
		

			// Build gridline array
			if(started){
				for( i = 0; i <= moment(times.end).diff(moment(times.start)) / 1000 / 60 / 6; i++ ){
					var time = moment.tz(times.gridStart, "GMT").add( i * 10, "minutes");
					grid.push( { y: y(time) + 50, time: time.format("h:mm a"), date: time.format("MMMM Do")  } );
				}
			}
			
			console.log(grid);

			// Normalize info for each ad
			ads.forEach(function(ad, i){
				ad.id = i;
				
				if( !started){
					ad.start_time = moment(ad.start_time + " -0000", "M/DD/YY H:mm:s ZZ");
					ad.end_time = moment(ad.end_time + "-0000", "M/DD/YY H:mm:s ZZ");
				}
				
				ad.x = x(ad.network);
				ad.y = y(ad.end_time);

				// Settle names and parties
				sponsorData = sponsors[sponsors.map(function(d){ return d.sponsor}).indexOf(ad.sponsor)]
				ad.name = sponsorData.name;
				ad.lastName = sponsorData.lastName;
				ad.party = sponsorData.party;

			});
		}
		
		function finishGame(){
			started = false;
			switchTitlecard("lost");
			
			// Turn off arrows
			d3.select(".controls").classed("hidden", true);
			
			// Count commercials watched
			var commercials = 0;
			console.log(collisions);
			for(key in collisions){
				if(collisions.hasOwnProperty(key))
					commercials++;
			}
			var hours = Math.abs(moment(y.invert(distanceTraveled)).diff(moment(times.start), "hour"));
			if( hours == 1 ) 
				hours += " hour"
			else 
				hours += " hours";
				
			d3.select(".titlecard #lost .count").text(commercials);
			d3.select(".titlecard #lost .elapsed").text(hours);
			d3.select(".titlecard #lost #tweet").attr("href", "https://twitter.com/intent/tweet?text=I tried to avoid campaign ads in @TheAtlantic's arcade game and made it " + hours + "!");
			
			d3.select(".titlecard")
				.classed("hidden", false)
			centerTitlecard();
		}


		// Resizing stuff
		
		d3.select(window).on("resize", function(){
			console.log("resize");
			x = d3.scale.ordinal()
				.domain(shuffle(networks.map(function(d,i){ return d.network })))
				.rangePoints([0, window.innerWidth]);

			// Build footer
			d3.select(".footer").selectAll(".network")
				.style("left", function(d){ return x(d.network) + "px"; })
				.style("width", 100 / networks.length + "%")
				.text(function(d){ return d.network });
				
			// Recenter titlecard
			centerTitlecard();
		});

		
	});
	
});


function centerTitlecard(){
	d3.select(".titlecard")
		.style({
			left: function(){ return (window.innerWidth - this.offsetWidth) / 2 +"px" },
			top: function(){ return (window.innerHeight - this.offsetHeight) / 2 +"px" }
		})
}

function switchTitlecard(target){
	d3.selectAll(".titlecard .section")
		.classed("hidden", true);
	
	d3.select(".titlecard #" + target)
		.classed("hidden", false);
	
	centerTitlecard();
}

function showPopup(message){
	console.log("message");
	var popup = d3.select(".popup");
	popup.html(message);
	popup.classed("hidden", false);
	
	setTimeout(function(){
		popup.classed("hidden", true);
	}, 3000);
	
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}