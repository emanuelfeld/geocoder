geocoder
===============
Provides an [R Shiny](http://shiny.rstudio.com/) interface for geocoding an uploaded CSV file, visualizing the resulting points on a [LeafletJS](http://leafletjs.com/) slippy map, and downloading the resulting CSV, with additional columns giving latitide and longitude. For best results, the address column should include the point's full address (street, city, state/country). 

View and **gently** use an instance of the app at https://emanuelfeld.shinyapps.io/geocoder/.

~~The geocoding function in server.R uses the Google Maps API [client-side geocoding](https://developers.google.com/maps/articles/geocodestrat#client). This enforces a limit of 2,500 requests per day and 5 per second, both per IP address. Because the API does not allow for batch geocoding, requests must be sent address by address. In other words, each geocoded row of the uploaded CSV counts toward those limits.~~

EDIT: Need to integrate JS to ui.R for client-side geocoding, so for the meantime the app does server-side geocoding at the 2,500 request limit is an aggregate across all app users.

The R Shiny web application renders the geocoded CSV as a sortable and searchable JQuery Datatable, displays the LeafletJS map, and permits download when all rows have been geocoded. This means that the operation will be slow for CSVs with more than a couple hundred rows, but should work well for most occasional uses. The default file size upload limit is 5 MB, well above anything this utility ought to be used for.

Upon upload, the original CSV can be searched and sorted as a Datatable by clicking on the 'Original' tab. The map defaults to show continental United States.

Beyond base R, this app depends on the CRAN packages [BH](http://cran.r-project.org/web/packages/BH/index.html), [dplyr](http://cran.r-project.org/web/packages/dplyr/index.html), [RCurl](http://cran.r-project.org/web/packages/RCurl/index.html),  [rjson](http://cran.r-project.org/web/packages/rjson/index.html), and [shiny](http://cran.r-project.org/web/packages/shiny/index.html), as well as non-CRAN packages [leaflet](https://rstudio.github.io/leaflet/) and [shinydashboard](https://github.com/rstudio/shinydashboard). The latter two can be installed from GitHub:

    if (!require('devtools')) install.packages('devtools')
    devtools::install_github('rstudio/leaflet')
    devtools::install_github('rstudio/shinydashboard')

![image](https://cloud.githubusercontent.com/assets/4269640/6200941/bf764334-b45d-11e4-95b3-a27e010059d6.png)
