var fyfApp = angular.module('fyfApp', []);

fyfApp.factory('onloadService', function($http, $q) {
	//Classifcation Name = "music", id="KZFzniwnSyZfZ7v7nJ"
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

fyfApp.factory('geocodeService', function($http, $q) {
	var geocodeSvc = {};
	geocodeSvc.convert = function(url) {
		var def = $q.defer();
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			def.resolve(rspns);
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
			def.reject(rspns);
		});
		return def.promise;
	}
	geocodeSvc.convertInLoop = function(url, content) {
		var def = $q.defer();
		var ctxt = content;
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			console.log(rspns);
			def.resolve(rspns);
			def.promise.$$state.value.data.results[0].ctxt = content;
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
			def.reject(rspns);
		});
		return def.promise;
	}
	return geocodeSvc;
});


fyfApp.controller('fyfCtrl', function($scope, onloadService, locateService,geocodeService) {
	//User's current location
	var myLatLng = {lat: 40.00, lng: -98.00};
	locateService.locate().then(function(position) {
		console.log(position);
	});
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: myLatLng
	});

	onloadService.getData()
	.then(function success(rspns) {
		var data = rspns.data._embedded.events;
		for (var i = 0; i < data.length; i++) {
			var index = i;
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
			var venueObj = new VenueObj(venue);
			//array of objects
			var fest = new FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue);
		}
		placeMarkers();
	}, function fail(rspns) {
		console.log("Failed due to " + rspns.status);
	});
	$scope.festArr = festArr;
	$scope.venueArr = venueArr;
	console.log($scope.festArr);
	console.log($scope.venueArr);
	

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

		function setMarkerOnMap(content, map, latLng) {
			var contentStr = content;
			var icon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=•%7CFE7569';
			var marker = new google.maps.Marker({
				position: latLng,
				map: map,
				title: venue.name,
				icon: icon
			});	
			console.log(contentStr);
			marker.addListener('click', function() {
				infoWindow.setContent(contentStr);
				infoWindow.open(map, marker);
			});
		}		
	}		
}
});

var festArr = [];
function FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue) {
	this.index = index;
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
	this.address = item.address.line1; 
	this.city = item.city.name;
	this.state = item.state; //object
	this.zipCode = item.postalCode;
	this.country = item.country; //object
	this.link = item.url;
	venueArr.push(this);
}
