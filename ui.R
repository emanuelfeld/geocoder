library(shinydashboard)
library(leaflet)

header <- dashboardHeader(
  title = "Geocoder"
)

body <- dashboardBody(
  fluidRow(
    column(width = 9,
      box(width = NULL, solidHeader = TRUE,
          leafletOutput("hmap", height = 500)),
      box(width = NULL, solidHeader = FALSE,
          tabsetPanel(type = "tabs", 
                      tabPanel("Geocoded",dataTableOutput('geocodeData')),                   
                      tabPanel("Original", dataTableOutput('contents'))
                    )
        )
    ),
    column(width = 3,
           box(width = NULL, height = NULL, status = "warning",
               fileInput('file1', '1. Choose CSV File',
                         accept=c('text/csv', 
                                  'text/comma-separated-values,text/plain', 
                                  '.csv')
                         ),
               checkboxInput('header', 'Header', TRUE),
               radioButtons('sep', 'Separator',
                            c(Comma=',',
                              Semicolon=';',
                              Tab='\t'),
                            ','),
               radioButtons('quote', 'Quote',
                            c(None='',
                              'Double Quote'='"',
                              'Single Quote'="'"),
                            '"'),
               uiOutput('choose_value'),
               uiOutput('run'),
               br(),
               uiOutput('download')
      )
    )
  )
)

dashboardPage(
  header,
  dashboardSidebar(disable = TRUE),
  body
)

