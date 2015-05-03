# geocoder

A simple web interface for geocoding addresses in an uploaded CSV file, visualizing the points on a [LeafletJS](http://leafletjs.com/) map, and downloading the result as a CSV and/or GeoJSON, with additional columns giving latitide and longitude.

For best results, the selected address column(s) should include the point's full address (street, city, state/country). The map can help you figure out if anything went awry.

Geocoding is done [client-side](https://developers.google.com/maps/articles/geocodestrat#client), courtesy of the Google Maps API. This enforces a limit of 2,500 requests per day and 5 per second, both per IP address. Because the API does not allow for batch geocoding, requests must be sent address by address. In other words, each geocoded row of the uploaded CSV counts toward those limits.

In light of these limits and because downloading is only permitted when all rows have been processed, I would advise against using the site for CSVs with more than a couple hundred rows. For most occasional uses, however, it should do the trick.

##License and Contributing##

This project's code is offered under a GPLv2 license. As stated in [CONTRIBUTING](https://raw.githubusercontent.com/emanuelfeld/tree-map/gh-pages/CONTRIBUTING.md):

    By contributing to this repo, you agree to license your work under the same license.
