#
# Example R code to install packages
# See http://cran.r-project.org/doc/manuals/R-admin.html#Installing-packages for details
#

###########################################################
# R packages to install from CRAN:

my_packages = c("BH","dplyr","RCurl","rjson","devtools")

###########################################################

install_if_missing = function(p) {
  if (p %in% rownames(installed.packages()) == FALSE) {
    install.packages(p, dependencies = TRUE)
  }
  else {
    cat(paste("Skipping already installed package:", p, "\n"))
  }
}
invisible(sapply(my_packages, install_if_missing))

###########################################################
# Non-CRAN R packages to install:

invisible(devtools::install_github('rstudio/leaflet'))
invisible(devtools::install_github('rstudio/shinydashboard'))
