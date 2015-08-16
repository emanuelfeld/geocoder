var info;
var coordinates = {};
var failure_count = 0;
var success_count = 0;
var locations = [];

var index = 0;
var field_list;
var field_index = 0;

var output_geojson = [];
var output_csv = [];

var delay = 300;
var geocoder = new google.maps.Geocoder();
var map;
var markers = [];


///////////////
/* LISTENERS */
///////////////

$('#files').bind('change', handleFileSelect);
$('#field_list').bind('change', toggleGeocoder);
$('#geocode_button').bind('click', setupGeocoder);
$('#failure_button').bind('click', toggleFailure);
$('#gist_button').bind('click', postGist);
$('#list_button').bind('click', makeList);

///////////////////////
/* MAPPING FUNCTIONS */
///////////////////////

function initialize () {
  var mapOptions = {
    zoom: 2,
    maxZoom: 18,
    center: new google.maps.LatLng(51.505, -0.09)
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function addMarker (location) {
  var marker = new google.maps.Marker({
    position: location,
    map: map
  });
  markers.push(marker);
}

// Sets the map on all markers in the array.
function setAllMap (map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function clearMarkers () {
  setAllMap(null);
}

function deleteMarkers () {
  clearMarkers();
  markers = [];
}

initialize();

//////////////////////////
/* FILE HANDLING AND UI */
//////////////////////////

// Take in uploaded file
function handleFileSelect (evt) {
  var files = evt.target.files;
  var parsed = Papa.parse(files[0], {
    header: true,
    complete: function (results) {
      info = results;
      $('#list_button').removeAttr('disabled');

      coordinates = {};
      field_index = 0;
      failure_count = 0;
      success_count = 0;
      delay = 300;
      locations = [];
      index = 0;

      // reset column choice section
      field_index = 0;
      $('.option').remove();
      $('.additional').remove();

      console.log('Uploading file.')
      console.log(info);

      makeList();
    }
  });
}

// Make the field dropdowns
function makeList () {
  console.log('Making list.');

  coordinates = {};
  failure_count = 0;
  success_count = 0;
  delay = 300;
  locations = [];
  index = 0;

  // Check if this is the first dropdown or another, and set things up accordingly
  if (field_index === 0) {
    field_list = $('#field_list');
    field_list.removeAttr('disabled');
    field_list.attr('list_number', field_index);
  } else {
    // Create div for 'additional' dropdown
    var list_div = $('<div/>');
    list_div.attr('class', 'additional');

    // Create dropdown select
    field_list = $('<select/>');
    field_list.attr({
      'class': 'field_list',
      'list_number': field_index
    });

    // Put option placeholder 'and this column' to await selection
    var list_placeholder = $('<option/>');
    list_placeholder.selected = 'selected';
    list_placeholder.text('And This Column');

    // Container
    var column_select = $('#column_select');

    // Put it all together
    field_list.append(list_placeholder);
    column_select.append(list_div);
    list_div.append(field_list);
  }

  // Create options for dropdown, from the uploaded file
  for (var i = 0; i < info.meta.fields.length; i++) {
    var field_option = new Option(info.meta.fields[i], info.meta.fields[i]);
    $(field_option).attr('class', 'option');
    field_list.append($(field_option));
  }

  // Increment number of dropdown menus
  field_index++;
}

// Show or hide the geocoding failure list
function toggleFailure () {
  if ($('#failure_list').attr('style') === 'display: none;') {
    $('#failure_list').attr('style', 'margin-top:10px; display: block; height:120px; width:100%; border:none; overflow:auto;');
    $('#failure_button').text('Hide failure_count');
  } else {
    $('#failure_list').attr('style', 'display: none;');
    $('#failure_button').text('Show failure_count');
  }
}

// Enable or disable run geocoder button
function toggleGeocoder () {
  coordinates = {};

  var geocode_button = $('#geocode_button');
  var selected = $('#field_list option:selected').text();
  if (selected !== 'This Column') {
    geocode_button.removeAttr('disabled');
  } else {
    geocode_button.attr('disabled', 'disabled');
  }
}

//////////////////////
/* DATA ACQUISITION */
//////////////////////

function setupGeocoder () {
  failure_count = 0;
  success_count = 0;

  deleteMarkers();

  // Reset failures upon geocoder re-run
  $('#failure_list').text('');
  $('#progress').text('');

  // Enable view failure button
  $('#failure_button').removeAttr('disabled');

  var selected_fields = [];
  var field_lists = $('.field_list');

  // Determine which options have been selected across all dropdowns
  [].forEach.call(field_lists, function (list) {
    var selected_field = list.selectedOptions[0].text;
    if (selected_field !== 'And This Column') {
      selected_fields.push(selected_field);
    }
  });

  gatherAddresses(selected_fields);
}

// Concatenate address strings across selected columns
function gatherAddresses (s) {
  locations = [];

  for (var i = 0; i < info.data.length; i++) {
    // Combine selected options to create full address string
    var address = [];
    [].forEach.call(s, function (x) {
      address.push(info.data[i][x]);
    });
    address = address.join(' ');
    locations.push(address);
  }

  iterateRows();
}

// Send each row to be geocoded
function iterateRows () {
  index = 0;

  var begin = function () {
    clearInterval(interval);
    if (index < info.data.length) {
      geocodeRow(index);
      interval = setInterval(begin, delay);
    }
  }
  var interval = setInterval(begin, delay);
}

function geocodeRow (i) {
  geocoder.geocode({
    'address': locations[i]
  }, function (gmap, status) {
    var lat, lon;

    if (status === google.maps.GeocoderStatus.OK) {
      lat = gmap[0].geometry.location.lat();
      lon = gmap[0].geometry.location.lng();
      index++;
      console.log('Status: OK; Address: ' + locations[i] + '; Latitude: ' + lat + ', Longitude: ' + lon + '; Delay: ' + delay);
    } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
      delay += 50;
      console.log('Status: OVER; Address: ' + locations[i] + '; Delay: ' + delay);
    } else {
      lat = 0;
      lon = 0;
      index++;
      console.log('Status: NOT LOCATED; Address: ' + locations[i] + '; Latitude: ' + lat + ', Longitude: ' + lon + '; Delay: ' + delay);
    }

    if (status !== google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
      var address_info = {
        'index': i,
        'latitude': lat,
        'longitude': lon,
        'address': locations[i]
      };

      if (lat === 0 & lon === 0) {
        failure_count++;
        $('#failure_list').append('Row ' + i + ': ' + locations[i] + '<br>');
      } else {
        success_count++;
        var location = new google.maps.LatLng(address_info.latitude, address_info.longitude);
        addMarker(location);
      }

      var progress = document.getElementById('progress');
      progress.textContent = success_count + ' of ' + info.data.length + ' geocoded and ' + failure_count + ' failure_count';

      collectPoints(address_info);
    }
  });
}

////////////////////////////////////
/* DATA COLLECTION AND FORMATTING */
////////////////////////////////////

// Gather results and format them for file (csv and geojson) output
function collectPoints (a) {
  coordinates[a.index] = a;

  if (Object.keys(coordinates).length === info.data.length) {
    var lat_list = [];
    var lon_list = [];
    output_csv = [];
    output_geojson = [];

    for (var i = 0; i < info.data.length; i++) {

      if (!(coordinates[i].latitude === 0 & coordinates[i].longitude === 0)) {
        lat_list.push(coordinates[i].latitude);
        lon_list.push(coordinates[i].longitude);
      };

      output_csv[i] = jQuery.extend({}, info.data[i], {
        'latitude': coordinates[i].latitude
      }, {
        'longitude': coordinates[i].longitude
      });

      output_geojson[i] = jQuery.extend({}, {
        'properties': info.data[i]
      }, {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [coordinates[i].longitude, coordinates[i].latitude]
        }
      });
    }

    output_geojson = {
      'type': 'FeatureCollection',
      'features': output_geojson
    };

    output_geojson = JSON.stringify(output_geojson, null, '\t');
    console.log(output_geojson);

    if (lat_list.length > 0) {
      var min_lat = Math.min.apply(Math, lat_list);
      var max_lat = Math.max.apply(Math, lat_list);
      var min_lon = Math.min.apply(Math, lon_list);
      var max_lon = Math.max.apply(Math, lon_list);

      var bounds = new google.maps.LatLngBounds();
      var min_bounds = new google.maps.LatLng(min_lat, min_lon);
      var max_bounds = new google.maps.LatLng(max_lat, max_lon);
      bounds.extend(min_bounds);
      bounds.extend(max_bounds);
      map.fitBounds(bounds);
    }

    var csv = Papa.unparse(output_csv);
    console.log(csv);

    var download = $('#download');
    download.removeAttr('disabled');
    download.text('');
    var download_link = $('<a/>');
    download_link.html('CSV');
    download_link.attr({
      'href': 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv),
      'target': '_blank',
      'download': 'geocoded.csv'
    });
    download.append(download_link);

    // enable geoJSON download link
    var geojson = $('#geojson');
    geojson.removeAttr('disabled');
    geojson.text('');
    var geojson_link = $('<a/>');
    geojson_link.html('GeoJSON');
    geojson_link.attr({
      'href': 'data:text/json;charset=utf-8,' + encodeURIComponent(output_geojson),
      'target': '_blank',
      'download': 'geocoded.json'
    });
    geojson.append(geojson_link);

    // Enable geoJSON-to-Gist button for easy map sharing
    var gist_button = $('#gist_button');
    gist_button.removeAttr('disabled');

  }
}

// Post geoJSON to GitHub Gist
function postGist () {

  var description = 'Map from geocode on ' + Date.now();

  var data = {
    'description': description,
    'public': true,
    'files': {
      'map.json': {
        'content': output_geojson
      }
    }
  }

  $.post('https://api.github.com/gists', JSON.stringify(data), function (d) {
    var gist_result = $('#gist_result');
    console.log(d.html_url);
    gist_result.attr('href', d.html_url);
    gist_result.text('Map now accessible here');
    console.log(d);
  });

}
