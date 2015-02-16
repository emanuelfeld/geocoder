library(shinydashboard)
library(leaflet)

head <- dashboardHeader(
  title=a(href="https://github.com/evonfriedland/geocoder","Geocoder")
  )

body <- dashboardBody( 
                      fluidRow(
                        column(width = 3,
                               box(width=NULL,height=NULL,
                                   status="primary",
                                   strong(p("Convert addresses in a CSV to geocoordinates and visualize them on a map")),
                                   strong(p("Code and details on",a(href="https://github.com/evonfriedland/geocoder","GitHub")))
                                   ),
                               box(width = NULL, height = NULL,status="warning",
                                   fileInput('file1', '1. Choose CSV File',
                                             accept=c('text/csv', 
                                                      'text/comma-separated-values,text/plain', 
                                                      '.csv')),
                                   checkboxInput('header', 'Header', TRUE),
                                   radioButtons('sep', 'Separator',
                                                c(Comma=',',
                                                  Semicolon=';',
                                                  Tab='\t'),
                                                ',',inline = TRUE),
                                   radioButtons('quote', 'Quote',
                                                c(None='',
                                                  'Double'='"',
                                                  'Single'="'"),
                                                '"',inline = TRUE),
                                   uiOutput('choose_value'),
                                   uiOutput('run'),
                                   br(),
                                   uiOutput('download')
                               )
                        ),
                        column(width = 9,
                                        box(width = NULL, solidHeader = TRUE,
                                            leafletOutput("hmap", height = 405)),
                                        tabBox(width=NULL,title = "Data",id="datatables", 
                                                tabPanel("Geocoded",dataTableOutput('geocodeData')),                   
                                                tabPanel("Original", dataTableOutput('contents'))))
                              )
                      )

dashboardPage(
  title="Geocoder",
  head,
  dashboardSidebar(disable = TRUE),
  body 
)



