var fyfApp = angular.module('fyfApp', []);

fyfApp.factory('onloadService', function($http, $q) {
	var base = 'https://app.ticketmaster.com/discovery/v2/events.json?';
	var queries = 'keyword=festival&classificationName=music&countryCode=US';
	var apiKey = '&apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';
	var url = base + queries + apiKey;
	// var url = 'http://api.eventful.com/json/events/search?q=festival&l=30308';
	var onloadEvents = {};
	onloadEvents.getData = function() {
		var def = $q.defer();
		$http({
			method: 'GET',
			url: url 
		}).then(function success(rspns) {
			console.log(rspns);
			def.resolve(rspns);
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
			console.log(rspns);
			def.reject('Error!');
		});
		return def.promise;
	};
	return onloadEvents;
});

fyfApp.factory('locateService', function($window, $q) {
	var locateSvc = {};
	locateSvc.locate = function() {
		var def = $q.defer();
		if (!$window.navigator.geolocation) {
			def.reject('Geolocation not available...');
		} else {
			console.log($window.navigator.geolocation);
			$window.navigator.geolocation.getCurrentPosition(
				function(position) {
					console.log(position);
					def.resolve(position);
				}, function (error) {
					def.reject(error);
				}
			);
		}
		return def.promise;
	}
	return locateSvc;
});

fyfApp.controller('fyfCtrl', function($scope, onloadService, locateService) {
	//User's current location
	var myLatLng = {lat: 40.00, lng: -98.00};
	locateService.locate().then(function(position) {
		console.log(position);
	});
	//Initialize the map
	// var myLatLng = {lat: 40.00, lng: -98.00};
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: myLatLng
	});

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

		
	});

// 'http://api.eventful.com/json/events/search?...&location=San+Diego'
});

function placeMarkers(festival, map) {
	var infoWindow = new google.maps.InfoWindow({});
	var venue = new VenueObj(festival.venue);
	if (venue.location !== undefined) {
		var latLng = {
			lat: Number(venue.location.latitude), 
			lng: Number(venue.location.longitude)
		};	
		var contentStr = festival.name + '<br/>' + venue.name;
		var icon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=•%7CFE7569';
		var marker = new google.maps.Marker({
			position: latLng,
			map: map,
			title: venue.name,
			icon: icon
		});	
		marker.addListener('click', function() {
			infoWindow.setContent(contentStr);
			infoWindow.open(map, marker);
		});
	}
}

var festArr = [];
function FestivalObj(name, id, desc, images, start, end, link, prices, performers, venue) {
	this.name = name;
	this.id = id;
	this.desc = desc;
	this.images = images;
	this.start = start;
	this.end = end;
	this.link = link;
	this.prices = prices;
	this.performers = performers;
	this.venue = venue;
	festArr.push(this);
}

var venueArr = [];
function VenueObj(item) {
	this.name = item.name;
	this.location = item.location; //object
	this.address1 = item.address.line1; 
	this.city = item.city.name;
	this.state = item.state; //object
	this.zipCode = item.postalCode;
	this.country = item.country; //object
	this.link = item.url;
	venueArr.push(this);
}
