node-hammerhead-design
======================

Set of tools to design Hammerhead Ribozymes. These were developed as part of the Ribosoft project, a webservice and HTTP API for designing hammerhead ribozymes.

##How it works##
More details soon.

##Installation##
###Github###

    $ git clone git://git@github.com:anas-ambri/node-hammerhead-design.git
    $ cd node-hammerhead-design
	

###NPM###
One can alternatively just use `npm`:
    $ npm install hammerhead-design

##Configuration##
###Dependencies###
This library relies on the following executables:

- [sFold](http://sfold.wadsworth.org/cgi-bin/index.pl): Software for Statistical Folding of Nucleic Acids and Studies of Regulatory RNAs. This was developed at the Wadsworth Center, NYS Department of Health. More details on licensing sFold can be found [here](http://sfold.wadsworth.org/SFOLD-EXE-ACADEMIC.html)
- [UNAFold](http://mfold.rna.albany.edu/): Unified Nucleic Acid Folding and hybridization package. This package was developed at the RNA institute, University at Albany.

These two executables need to be installed on your system. The path to the executables must be supplied in `config/config.json`.

##Tests##
The command `npm test` will do.

##Licence##
Copyright all rights reserved Dr. Nawwaf Kharma
Contact Dr. Kharma at [kharma@ece.concordia.ca](kharma@ece.concordia.ca)