'use strict';

(function () {
  var App = function (map) {
    this.mapOptions = {
      zoom: 2,
      maxZoom: 18,
      center: new google.maps.LatLng(51.505, -0.09)
    }

    this.map = new google.maps.Map(document.getElementById('map'), this.mapOptions)
    this.markers = []

    this.geocoder = new Geocoder(this, this.map)

    this.rowCount = 0
    this.failureCount = 0
    this.successCount = 0
    this.processedCount = 0

    this.fieldCount = 1

    this.uploadButton = $('#uploadButton')
    this.fieldMenus = $('.fieldMenu')
    this.geocodeButton = $('#geocodeButton')
    this.failureButton = $('#failureButton')
    this.csvButton = $('#csvButton')
    this.geojsonButton = $('#geojsonButton')
    this.gistButton = $('#gistButton')
    this.failures = $('#failures')
    this.progress = $('#progress')
  }

  App.prototype = {
    reset: function () {
      this.map = new google.maps.Map(document.getElementById('map'), this.mapOptions)
      this.failureCount = 0
      this.successCount = 0
      this.processedCount = 0

      this.failures.text('')
      this.progress.text('')
      this.clearMarkers()

      this.geocoder.reset()

      $('#gistResult').text('')
      this.gistButton.removeClass('hidden')
      this.gistButton.attr('disabled', 'disabled')
      this.csvButton.attr('disabled', 'disabled')
      this.csvButton.text('CSV')
      this.geojsonButton.attr('disabled', 'disabled')
      this.geojsonButton.text('GeoJSON')
      this.failureButton.attr('disabled', 'disabled')
      this.geocodeButton.removeAttr('disabled')
    },

    monitorProgress: function (output) {
      $('#progress').text(this.successCount + ' of ' + this.rowCount + ' found and ' + this.failureCount + ' failures')

      if (this.processedCount === this.rowCount) {
        this.zoomToMarkers(output)
        this.makeGeoJSON(output)
        this.makeCSV(output)
        this.geojsonButton.removeAttr('disabled')
        this.csvButton.removeAttr('disabled')
      } else {
        this.geocoder.run(this.fields, this.processedCount)
      }
    },

    loadFile: function (event) {
      let file = event.target.files[0]
      let self = this

      Papa.parse(file, {
        header: true,
        complete: function (res) {
          self.reset()
          self.rowCount = res.data.length
          self.fields = res.meta.fields
          self.geocoder.input = res.data
          self.geocoder.output = new Array(self.rowCount)
          self.geocoder.fields = new Set(self.fields)
          self.resetFieldMenus()
        }
      })
    },

    resetFieldMenus: function () {
      $('.extraFields').remove()
      this.addFieldOptions(0, this.fields)
      this.fieldCount = 1
    },

    addFieldMenu: function () {
      let fieldDiv = $('<div/>')
      fieldDiv.attr('class', 'extraFields')
      let fieldMenu = $('<select/>')
      fieldMenu.attr('id', 'fieldMenu-' + this.fieldCount)
      fieldMenu.attr('class', 'fieldMenu')
      fieldDiv.append(fieldMenu)
      $('#fieldStep').append(fieldDiv)
      this.addFieldOptions(this.fieldCount, this.fields)
      this.fieldCount++
    },

    addFieldOptions: function (index, fields) {
      let fieldMenu = $('#fieldMenu-' + index)
      fieldMenu.text('')
      fields.unshift('And This Column')

      for (let i = 0; i < fields.length; i++) {
        let field = new Option(fields[i], fields[i])
        $(field).attr('class', 'option')
        if (i === 0) {
          $(field).attr('disabled', 'disabled')
          $(field).attr('selected', 'selected')
        }
        fieldMenu.append($(field))
      }
      fieldMenu.removeAttr('disabled')
    },

    addFailure: function (data) {
      this.failures.append('Row ' + data.row + ': ' + data.text + '<br>')
    },

    toggleFailures: function () {
      if (this.failures.hasClass('hidden')) {
        this.failureButton.text('Hide Failures')
      } else {
        this.failureButton.text('View Failures')
      }
      this.failures.toggleClass('hidden')
    },

    makeFeature: function (data) {
      let geometry = {
        'type': 'Point',
        'coordinates': [data.longitude, data.latitude]
      }

      let properties = Object.assign({}, data)
      delete properties.latitude
      delete properties.longitude

      return {
        'type': 'Feature',
        'properties': properties,
        'geometry': geometry
      }
    },

    makeGeoJSON: function (arr) {
      let features = []
      for (let i = 0; i < arr.length; i++) {
        if (arr[i]) {
          features.push(this.makeFeature(arr[i]))
        }
      }

      this.geojson = JSON.stringify({
        'type': 'FeatureCollection',
        'features': features
      }, null, '\t')

      this.geojsonButton.removeAttr('disabled')
      this.geojsonButton.text('')
      let geojsonLink = $('<a/>')
      geojsonLink.html('GeoJSON')
      geojsonLink.attr({
        'href': 'data:text/jsoncharset=utf-8,' + encodeURIComponent(this.geojson),
        'target': '_blank',
        'download': 'dcmar.json'
      })
      this.geojsonButton.append(geojsonLink)

      this.gistButton.removeAttr('disabled')
    },

    makeCSV: function (arr) {
      let rowDefault = {}
      for (let i = 0; i < this.geocoder.fields.length; i++) {
        let field = this.geocoder.fields[i]
        rowDefault[field] = ''
      }

      this.csv = []
      for (let i = 0; i < arr.length; i++) {
        let row = arr[i]
        let rowFields = new Set(Object.keys(row))
        if (rowFields !== this.geocoder.fields) {
          row = Object.assign({}, rowDefault, row)
        }
        this.csv.push(row)
      }

      this.csv = Papa.unparse(this.csv)
      this.csv = encodeURIComponent(this.csv).replace(/%0D%0A(%2C)+%0D/, '%0D')

      this.csvButton.removeAttr('disabled')
      this.csvButton.text('')
      let csvLink = $('<a/>')
      csvLink.html('CSV')
      csvLink.attr({
        'href': 'data:application/csvcharset=utf-8,' + this.csv,
        'target': '_blank',
        'download': 'dcmar.csv'
      })
      this.csvButton.append(csvLink)
    },

    postGist: function () {
      let fileDescription = 'Map generated by https://emanuelfeld.github.io/geocoder on ' + new Date()

      let data = {
        'description': fileDescription,
        'public': true,
        'files': {
          'map.json': {
            'content': this.geojson
          }
        }
      }

      let apiURL = 'https://api.github.com/gists'
      let self = this
      $.post(apiURL, JSON.stringify(data), function (res) {
        let gistResult = $('#gistResult')
        gistResult.attr('href', res.html_url)
        gistResult.text('Click here to view shareable map')
        self.gistButton.addClass('hidden')
      })
    },

    addMarker: function (lat, lon) {
      let location = new google.maps.LatLng(lat, lon)
      let self = this
      let marker = new google.maps.Marker({
        position: location,
        map: self.map
      })
      this.markers.push(marker)
    },

    clearMarkers: function () {
      for (let i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null)
      }
    },

    getBounds: function (objArray, key) {
      let maxValue = -Infinity
      let minValue = Infinity

      for (let i = 0; i < objArray.length; i++) {
        if (objArray[i][key] !== 0) {
          maxValue = Math.max(objArray[i][key], maxValue)
          minValue = Math.min(objArray[i][key], minValue)
        }
      }

      return [minValue, maxValue]
    },

    zoomToMarkers: function (output) {
      let [latMin, latMax] = this.getBounds(output, 'latitude')
      let [lonMin, lonMax] = this.getBounds(output, 'longitude')

      if ([latMin, latMax, lonMin, lonMax].every(Number.isFinite)) {
        let mapBounds = new google.maps.LatLngBounds()
        let minBounds = new google.maps.LatLng(latMin, lonMin)
        let maxBounds = new google.maps.LatLng(latMax, lonMax)

        mapBounds.extend(minBounds)
        mapBounds.extend(maxBounds)
        this.map.fitBounds(mapBounds)
      }
    }
  }

  var Geocoder = function (app, map) {
    this.gGeocoder = new google.maps.Geocoder()
    this.delay = 300
    this.app = app
    this.input = []
    this.output = []
    this.failures = []
  }

  Geocoder.prototype = {
    reset: function () {
      this.output = new Array(this.input.length)
      this.failures = []
    },

    run: function (fields, index) {
      if (index < this.input.length) {
        let timer = setInterval(runner, this.delay)
        let self = this

        function runner () {
          let address = []
          for (let i = 0; i < fields.length; i++) {
            let field = fields[i]
            address.push(self.input[index][field])
          }

          address = address.join(' ')
          self.geocodeAddress(address, index)
          clearInterval(timer)
        }
      }
    },

    geocodeAddress: function (address, index) {
      address = address.toLowerCase()

      let data = {
        'latitude': 0,
        'longitude': 0
      }

      let self = this

      this.gGeocoder.geocode({
        'address': address
      }, function (gmap, status) {
        if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
          self.delay += 50
        } else if (status === google.maps.GeocoderStatus.OK) {
          data['latitude'] = gmap[0].geometry.location.lat()
          data['longitude'] = gmap[0].geometry.location.lng()
          self.app.successCount++
          self.app.processedCount++
          self.output[index] = Object.assign(self.input[index], data)
          self.app.addMarker(data['latitude'], data['longitude'])
        } else {
          self.app.failureCount++
          self.app.processedCount++
          self.output[index] = Object.assign(self.input[index], data)
          self.app.addFailure({
            'row': index + 1,
            'text': address
          })
        }
        self.app.monitorProgress(self.output)
      })
    }
  }

  window.onload = function () {
    let app = new App()

    app.fieldMenus.on('change', function (event) {
      app.reset()
      $('#addFieldsButton').removeAttr('disabled')
    })

    $('#addFieldsButton').on('click', function (event) {
      app.addFieldMenu()
    })

    app.failureButton.on('click', function (event) {
      app.toggleFailures()
    })

    app.geocodeButton.on('click', function (event) {
      app.reset()
      app.fields = []
      for (let i = 0; i < app.fieldCount; i++) {
        let field = $('#fieldMenu-' + i + ' option:selected').text()
        if (field !== 'And This Column') {
          app.fields.push(field)
        }
      }

      app.failureButton.removeAttr('disabled')
      app.geocoder.run(app.fields, 0)
    })

    app.gistButton.on('click', function (event) {
      app.postGist()
    })

    app.uploadButton.on('change', function (event) {
      app.loadFile(event)
    })
  }
})()
