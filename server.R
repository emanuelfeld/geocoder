library(shinydashboard)
library(leaflet)
library(dplyr)
library(shiny)
library(RJSONIO)
library(RCurl)
library(BH)

geocoder <- function(data, address) {
  address_v <- data[, c(address)]
  address_v <- gsub(" ", "+", address_v)
  for (i in 1:length(address_v)) {
    url <- fromJSON(getURL(paste("https://maps.googleapis.com/maps/api/geocode/json?address=", address_v[i], sep = "")))
    data$lat[i] <- url$results[[1]]$geometry$location[1]
    data$lng[i] <- url$results[[1]]$geometry$location[2]
    Sys.sleep(0.1)
  }
  return(data)
}

function(input, output, session) {
  
  datasetInput <- reactive({
    inFile <- input$file1
    if (is.null(inFile)) 
      return(NULL)
    input_data <<- read.csv(inFile$datapath, header = input$header, sep = input$sep, quote = input$quote)
    return(input_data)
  })
  
  output$contents <- renderDataTable({
    datasetInput()
  }, options = list(scrollX = TRUE, pageLength = 5, lengthMenu = list(c(5, 15, -1), c("5", "15", "All"))))
  
  output$choose_value <- renderUI({
    if (is.null(datasetInput())) 
      return(NULL)
    valslist <- c("", colnames(input_data))
    selectInput("value", "2. Select Address Column and Run Geocoder", valslist)
  })
  
  geocodedInput <- reactive({
    input$run
    isolate({
      geocoder(datasetInput(), input$value)
    })
  })
  
  output$geocodeData <- renderDataTable({
    try(geocodedInput(), silent = TRUE)
  }, options = list(scrollX = TRUE, pageLength = 5, lengthMenu = list(c(5, 15, -1), c("5", "15", "All"))))
  
  output$downloadData <- downloadHandler(filename = function() {
    paste("geocoded", ".csv", sep = "")
  }, content = function(file) {
    write.csv(geocodedInput(), file,row.names=FALSE)
  })
  
  output$run <- renderUI({
    if (is.null(datasetInput())) 
      return(NULL)
    actionButton("run", "Geocode")
  })
  
  output$download <- renderUI({
    if (is.null(input$value)) 
      return(NULL)
    if (input$value == "") 
      return(NULL)
    downloadButton("downloadData", "Download Geocoded CSV")
  })
  
  err <- function() {
    map_good <- tryCatch({
      as.character(geocodedInput())
    }, warning = function(w) {
      "try_again"
    }, error = function(e) {
      "try_again"
    })
    map_good
  }
  
  output$hmap <- renderLeaflet({
    if (err()[1] == "try_again") {
      map <- leaflet() %>% 
        addTiles("//{s}.tiles.mapbox.com/v3/jcheng.map-5ebohr46/{z}/{x}/{y}.png",attribution = 'Maps by <a href="http://www.mapbox.com/">Mapbox</a>') %>% 
        setView(-93.85, 37.45, zoom = 4)
    } else {
      map <- leaflet(geocodedInput()) %>% 
        addTiles("//{s}.tiles.mapbox.com/v3/jcheng.map-5ebohr46/{z}/{x}/{y}.png",attribution = 'Maps by <a href="http://www.mapbox.com/">Mapbox</a>') %>% 
        setView(-93.85, 37.45, zoom = 4) %>% 
        addCircleMarkers(radius = 1, color = c("red")) %>% 
        clearBounds()
    }    
    map
  })
} 
