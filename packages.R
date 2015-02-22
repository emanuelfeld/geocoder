
###########################################################
# R packages to install from CRAN:

my_packages = c("dplyr","RCurl","devtools","BH")

###########################################################

install_if_missing = function(p) {
  if (p %in% rownames(installed.packages()) == FALSE) {
    install.packages(p)
  }
  else {
    cat(paste("Skipping already installed package:", p, "\n"))
  }
}
invisible(sapply(my_packages, install_if_missing))

###########################################################
# Non-CRAN R packages to install:

devtools::install_github('rstudio/leaflet')
devtools::install_github('rstudio/shinydashboard')
