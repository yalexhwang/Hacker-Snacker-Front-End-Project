var fyfApp = angular.module('fyfApp', []);

fyfApp.factory('onloadService', function($http, $q) {
	var base = 'https://app.ticketmaster.com/discovery/v2/events.json?';
	var queries = 'keyword=festival&classificationName=music&countryCode=US';
	var apiKey = '&apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';
	var url = base + queries + apiKey;

	var onloadEvents = {};
	onloadEvents.getData = function() {
		var deferred = $q.defer();
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			console.log(rspns);
			deferred.resolve(rspns);
		}, function fail(rspns) {
			console.log("Failed due to " + status);
			deferred.reject('Error!');
		});
		return deferred.promise;
	};
	return onloadEvents;
});

fyfApp.controller('fyfCtrl', function($scope, onloadService) {
	//User's current location
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function (position) {
			console.log(position);
			var myLat = position.coords.latitude;
			var myLng = position.coords.longitude;
			console.log (myLat + myLng);
		})
	}
	//Initialize the map
	var myLatLng = {lat: 40.00, lng: -98.00};
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: myLatLng
	});

	onloadService.getData().then(function success(rspns) {
		$scope.initialData = rspns.data._embedded.events;
		var data = $scope.initialData;
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
			var venueOjb = new VenueObj(venue);
		}
		placeMarkers();
	}, function fail(rspns) {
		console.log("Failed due to " + status);
	});
	console.log(festArr);
	console.log(venueArr);
	placeMarkers();

	var currentMarkers = [];
	function placeMarkers() {
		for (var i = 0; i < venueArr.length; i++) {
			if (venueArr[i].location !== undefined) {
				var latLng = {
					lat: Number(venueArr[i].location.latitude), 
					lng: Number(venueArr[i].location.longitude)
				};	
				console.log(latLng);
				var icon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=•%7CFE7569';
				var marker = new google.maps.Marker({
					position: latLng,
					map: map,
					title: venueArr[i].name,
					icon: icon
				});	
				var infoWindow = new google.maps.InfoWindow({});
			}	
		}
	}

});

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
