#Hacker-Snackers Front-End-Project

![Alt text](img/revelry4.png "Revelry Logo")

###A dynamic app that allows users to locates music festivals around the nation by utilizing the search options to narroow down their unique preferences and display the locations on an interactive map.

##Built with:
	- Google Maps API 
	- AngularJS 
	- Bootstrap
	- Html & CSS

##Sample Code
###The following code represents the ...
```javascript
onloadService.getData().then(function success(rspns) {
		var data = rspns.data._embedded.events;
		for (var i = 0; i < data.length; i++) {
			var name = data[i].name;
			var id = data[i].id;
			var desc = data[i].info;
			var images = data[i].images;  //array of objects
			var start = data[i].dates.start.localDate;
			var end = "n/a";
			var link = data[i].url;
			var prices = data[i].priceRanges; 
			//array of objects: currecny, max, min, type
			var performers = data[i]._embedded.attractions;
			//array of objects
			var venue = data[i]._embedded.venues[0]; 
			//array of objects
			var fest = new FestivalObj(name, id, desc, images, start, end, link, prices, performers, venue);
		}
		for (var i = 0; i < festArr.length; i++) {
			console.log(festArr[i]);
			placeMarkers(festArr[i], map);
		}
	}, function fail(rspns) {
		console.log("Failed due to " + status);
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