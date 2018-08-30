# Hacker-Snackers' Find Your Festival

Find Your Festival finds the perfect music festivals around the country, just for you. Set your search criteria, you will be given an interactive map with all music festivals that match your unique preferences. 

![Alt text](img/map-search.png "Sample outcome")

### Technologies & Frameworks 
- HTML
- CSS, Bootstrap
- JavaScript, AngularJS
- Google Maps API, TicketMaster API 

### Sample Code
The following code places the festivals, in the form of a marker, onto the map
```javascript
var markers = [];
	function resetMarkers() {
		if (markers.length !== 0) {
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
		}
		markers = [];
	}

var infoWindow = new google.maps.InfoWindow({});
	function placeMarkers(venue, fest) {
		var content = '<h6>' + fest.name + '<br/><small>' + venue.name + '</small>';
		var lat = venue.coords.lat;
		var lng = venue.coords.lng;
		console.log(lat + ", " + lng);
		var icon = 'img/location-pin.png';
		var marker = new google.maps.Marker({
			position: {lat: lat, lng: lng},
			map: map,
			title: venue.name,
			icon: icon,
			animation: google.maps.Animation.DROP,
		});
		
		marker.addListener('click', function() {
			infoWindow.setContent(content);
			infoWindow.open(map, marker);
			map.setZoom(12);
			map.setCenter(marker.getPosition());
		});
		markers.push(marker);
	} 
```

### Future Implementations
- Directions: user can set a music festival as desintation and get directions
- Weather forecast: display the weather information for each music festival
- Budget calculator: displays the total amount of estimated expenses, including food, transportation and lodging for each festival

### Team Members
- [Alex Hwang](https://github.com/yalexhwang)
- [Daniel Barranco](https://github.com/carrottop17)
- [Danielle Withers](https://github.com/DIWithers)
- [Shirlette Chambers](https://github.com/Shirlazybrat)

![Alt text](img/whiteboard.jpg "Whiteboarding our thoughts")
![Alt text](img/snackers.jpg "Members at work")
