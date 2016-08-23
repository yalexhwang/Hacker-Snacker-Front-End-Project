#Hacker-Snackers Front-End-Project

![Alt text](img/revelry4.png "Revelry Logo")

###A dynamic app that allows users to locates music festivals around the nation by utilizing the search options to narroow down their unique preferences and display the locations on an interactive map.

##Built with:
	- Html
	- CSS
	- Google Maps API 
	- AngularJS 
	- Bootstrap

##Sample Code
###The following code was created to place the markers onto the map based on the selection of the user to geographically locate the music festivals taking place during a specified time.
```javascript
function placeMarkers() {
	var infoWindow = new google.maps.InfoWindow({});
	for (var i = 0; i < $scope.venueArr.length; i++) {
		if ($scope.venueArr[i].location == undefined) {
			var venue = $scope.venueArr[i];
			var festival = $scope.festArr[i];
			var content = festival.name + "<br/>" + venue.name;
			var latLng = {};
			var address = venue.address;
			address += ', ' + venue.city;
			address += ', ' + venue.state.stateCode;
			address +- venue.zipCode;
			address = address.replace(/\s/g, "+");
			console.log(address);
			var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address;
			geocodeService.convertInLoop(url, content)
			.then(function success(rspns) {
				var location = rspns.data.results[0].geometry.location;
				var contentStr = rspns.data.results[0].ctxt;
				latLng = {
					lat: Number(location.lat), 
					lng: Number(location.lng)
				};
				setMarkerOnMap(contentStr, map, latLng);	
			}, function fail(rspns) {
				console.log("Failed due to " + rspns.status);
			});
		} else {
			var venue = $scope.venueArr[i];
			var festival = $scope.festArr[i];
			var contentStr = festival.name + "<br/>" + venue.name;
			var latLng = {
				lat: Number(venue.location.latitude), 
				lng: Number(venue.location.longitude)
			};	
			setMarkerOnMap(contentStr, map, latLng);	
		}
```

##Products of pair-programming

####Whiteboarding our thoughts
![Alt text](img/whiteboard.jpg "Whiteboarding our thoughts")

####Sample outcome of sprint Day 1
![Alt text](img/map-search.png "Sample outcome")


##Team Member Github accounts
###Please visit our personal profiles to see our current projects.
- [Daniel Barranco](https://github.com/carrottop17)
- [Alex Hwang](https://github.com/yalexhwang)
- [Danielle Withers](https://github.com/DIWithers)
- [Shirlette Chambers](https://github.com/Shirlazybrat)

![Alt text](img/snackers.jpg "Members at work")