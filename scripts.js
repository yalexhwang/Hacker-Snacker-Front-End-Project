var fyfApp = angular.module('fyfApp', []);

fyfApp.factory('onloadService', function($http, $q) {
	//Classifcation Name = "music", id="KZFzniwnSyZfZ7v7nJ"
	var base = 'https://app.ticketmaster.com/discovery/v2/events.json?';
	var queries = 'keyword=festival&classificationName=music&countryCode=US';
	var apiKey = '&apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';
	var url = base + queries + apiKey;
	
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
	geocodeSvc.convertInLoop = function(url, festival, venue) {
		var def = $q.defer();
		var ctxt = [festival, venue];
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			console.log(rspns);
			def.resolve(rspns);
			def.promise.$$state.value.data.results[0].ctxt = ctxt;
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
			def.reject(rspns);
		});
		return def.promise;
	}
	return geocodeSvc;
});


fyfApp.controller('fyfCtrl', function($scope, $http, onloadService, locateService,geocodeService) {
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
	
	
	var keywordArr = [];
	$scope.addArtist = function() {
		console.log($scope.artist);
		keywordArr.push($scope.artist);
	};
	$scope.addFestival = function() {
		console.log($scope.festival);
		keywordArr.push($scope.festival);
	};

	$scope.search = function() {
		festArr = [];
		venueArr = [];

		var startDate;
		var endDate;
		var city;
		var state;
		var zip;
		var radius;

		var keywordQuery = "&keyword=festival";
		var genreQuery = "&classificationName=music";
		var startDateQuery = "";
		var endDateQuery = "";
		var cityQuery = "";
		var stateQuery = "";
		var zipQuery = "";
		var radiusQuery = "&radius=500";
		// var unitQuery = "";

		//Dates
		if ($scope.startDate) {
			startDate = $scope.startDate;
			startDate = convertDateForAPI(startDate);
			console.log("corrected? " + startDate);
			stateQuery += "&startDateTime=" + startDate;
		} 
		if ($scope.endDate) {
			endDate = $scope.endDate;
			endDate = convertDateForAPI(endDate);
			console.log("corrected? " + endDate);
			endQuery += "&endDateTime=" + endDate;
		}
		//Genres
		var additionalGenreQuery = "";
		console.log($scope.genre);
		if ($scope.genre) {
			for (var i = 0; i < $scope.genre.length; i++) {
				if ($scope.genre[i] === "all") {
					additionalGenreQuery = "";
				} else {
					additionalGenreQuery += ", " + $scope.genre[i];
				}
			}
		}
		genreQuery = genreQuery + additionalGenreQuery;
		console.log(genreQuery);
		//classificationName= %2C+
		//Location
		if ($scope.locCity) {
			city = $scope.locCity;
			cityQuery += "&city=" + city;
		}
		if ($scope.locState) {
			state = $scope.locState;
			stateQuery += "&stateCode=" + state;
		}
		if ($scope.locZip) {
			zip = $scope.locZip;
			zipQuery += "&postalCode=" + zip;
		}
		if ($scope.radius) {
			radius = $scope.radius;
			radiusQuery = "&radius=" + radius;
		}

		var base = 'https://app.ticketmaster.com/discovery/v2/events.json?';
		var apiKey = '&apikey=Xe61EAoXgKAnv40G5NGgdYS2rTofYHS7';
		var query = keywordQuery + startDateQuery + endDateQuery + cityQuery + stateQuery + zipQuery + radiusQuery;
		var url = base + "countryCode=US" + query + apiKey;
		console.log(url);
		$http({
			method: 'GET',
			url: url
		}).then(function success(rspns) {
			console.log(rspns);
			var data = rspns.data;
			if (data.hasOwnProperty('_embedded')) {
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
				$scope.festArr = festArr;
				$scope.venueArr = venueArr;
				console.log($scope.festArr);
				console.log($scope.venueArr);
				console.log("???");
				placeMarkers();
			} else {
				console.log("0 Result Returned.");
			}
		}, function fail(rspns) {
			console.log("Failed due to " + rspns.status);
		});
	};

function convertDateForAPI(inputDate) {
	var tempYr = inputDate.getFullYear().toString();
	var tempMo = (inputDate.getMonth() + 1).toString();
	var mo = "0";
	var tempDt = (inputDate.getDate()).toString();
	var dt = "0";
	if (tempMo.length === 1) {
		tempMo = mo + tempMo;
	}
	if (tempDt.length === 1) {
		tempDt = dt + tempDt;
	}
	inputDate = tempYr + "-" + tempMo + "-" + tempDt + "T00:00:00Z";
	console.log(inputDate);
	return inputDate; 
}

function placeMarkers() {
	var infoWindow = new google.maps.InfoWindow({});
	for (var i = 0; i < $scope.venueArr.length; i++) {
		if ($scope.venueArr[i].location == undefined) {
			var venue = $scope.venueArr[i];
			var festival = $scope.festArr[i];
			var latLng = {};
			var address = venue.address;
			address += ', ' + venue.city;
			address += ', ' + venue.state.stateCode;
			address +- venue.zipCode;
			address = address.replace(/\s/g, "+");
			var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address;
			geocodeService.convertInLoop(url, festival, venue)
			.then(function success(rspns) {
				var location = rspns.data.results[0].geometry.location;
				var ctxt = rspns.data.results[0].ctxt;
				var festival = ctxt[0];
				var venue = ctxt[1];
				console.log(festival);
				console.log(venue);
				latLng = {
					lat: Number(location.lat), 
					lng: Number(location.lng)
				};
				setMarkerOnMap(map, latLng, festival, venue);	
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
			setMarkerOnMap(map, latLng, festival, venue);	
		}

		function setMarkerOnMap(map, latLng, festival, venue) {
			var contentStr = festival.name + "<br/>" + venue.name;
			console.log(festival.index);
			var icon = 'img/location-pin.png';
			var marker = new google.maps.Marker({
				position: latLng,
				map: map,
				title: venue.name,
				icon: icon
			});	
			console.log(contentStr);
			marker.addListener('click', function() {
				var index = festival.index;
				console.log("this is " + index);
				infoWindow.setContent(contentStr);
				infoWindow.open(map, marker);
				highlightOnList(festival);
			});
		}

		function highlightOnList(festival) {
			console.log(festival);
			console.log(festival.highlight);
			festival.highlight = true;
		}		
	}		
}


});

var festArr = [];
function FestivalObj(index, name, id, desc, images, start, end, link, prices, performers, venue, highlight) {
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
	this.highlight = false;
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
