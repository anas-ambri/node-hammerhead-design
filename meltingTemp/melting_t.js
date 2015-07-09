function substr_count (str, substr)
{
	return str.split(substr).length - 1;
}

// Simplest version
function tm_Basic(oligo)
{
	var nAT =0,nGC=0;
	for(var ii = 0; ii < oligo.length ; ++ii)
	{
		if(oligo[ii] == 'A' || oligo[ii] == 'U')
			nAT++;
		else if(oligo[ii] == 'G' || oligo[ii] == 'C')
			nGC++;
	}
	return nAT * 2 + nGC * 4 + 273;
}

//primer, and salt concentration (Na + K) in mM
//Primer must containt no spaces and have T bases. (DNA)
function tm_Salt_Adjusted(str, conc_salt)
{
    var c = 0;
    for (var ii = 0; ii < str.length; ++ii)
    {
        if (str[ii] == 'G' || str[ii] == 'C')
            c++;
    }
    var percentGC = 100 * c / str.length;

    var nAT =0,nGC=0;
    for (var ii = 0; ii < str.length ; ++ii)
    {
        if (str[ii] == 'A' || str[ii] == 'U')
            nAT++;
        else if (str[ii] == 'G' || str[ii] == 'C')
            nGC++;
    }

    if (str.length < 14)
    {
        var res = nAT * 2 + nGC * 4 - 7.209288 * Math.log(0.050) + 7.209288 * Math.log(conc_salt / 1000);
        return res + 273;
    }
    else if (str.length < 100)
    {
        var res = 100.5 + (41 * (nGC) / (nAT + nGC)) - (820 / (nAT + nGC)) + 7.209288 * Math.log(conc_salt / 1000);
        return res + 273;
    }
    else
    {
	var res = 81.5 + 7.209288 * Math.log(conc_salt / 1000) + 0.41 * percentGC - 675 / str.length;
        return res + 273;
    }
}

//Params: Primer string, concentration of primer in nM, concentration of salt in mM (Na + K ), concentration of Mg in mM
function tm_Base_Stacking($c,$conc_primer,$conc_salt,$conc_mg){

        if (CountATCG($c)!= $c.length){console.log( "The oligonucleotide is not valid");return;}
        $h=$s=0;
		var $array_h = new Object();
        // enthalpy values
        $array_h["AA"]= -7.9;
        $array_h["AC"]= -8.4;
        $array_h["AG"]= -7.8;
        $array_h["AT"]= -7.2;
        $array_h["CA"]= -8.5;
        $array_h["CC"]= -8.0;
        $array_h["CG"]=-10.6;
        $array_h["CT"]= -7.8;
        $array_h["GA"]= -8.2;
        $array_h["GC"]=-10.6;
        $array_h["GG"]= -8.0;
        $array_h["GT"]= -8.4;
        $array_h["TA"]= -7.2;
        $array_h["TC"]= -8.2;
        $array_h["TG"]= -8.5;
        $array_h["TT"]= -7.9;
        // entropy values
		var $array_s = new Object();
        $array_s["AA"]=-22.2;
        $array_s["AC"]=-22.4;
        $array_s["AG"]=-21.0;
        $array_s["AT"]=-20.4;
        $array_s["CA"]=-22.7;
        $array_s["CC"]=-19.9;
        $array_s["CG"]=-27.2;
        $array_s["CT"]=-21.0;
        $array_s["GA"]=-22.2;
        $array_s["GC"]=-27.2;
        $array_s["GG"]=-19.9;
        $array_s["GT"]=-22.4;
        $array_s["TA"]=-21.3;
        $array_s["TC"]=-22.2;
        $array_s["TG"]=-22.7;
        $array_s["TT"]=-22.2;

        // effect on entropy by salt correction; von Ahsen et al 1999
		// Increase of stability due to presence of Mg;
		$salt_effect= ($conc_salt/1000)+(($conc_mg/1000) * 140);
		// effect on entropy
		$s+=0.368 * (($c.length)-1)* Math.log($salt_effect);

        // terminal corrections. Santalucia 1998
		$firstnucleotide=$c.substr(0,1);
		if ($firstnucleotide=="G" || $firstnucleotide=="C"){$h+=0.1; $s+=-2.8;}
		if ($firstnucleotide=="A" || $firstnucleotide=="T"){$h+=2.3; $s+=4.1;}

		$lastnucleotide=$c.substr($c.length-1,1);
		if ($lastnucleotide=="G" || $lastnucleotide=="C"){$h+=0.1; $s+=-2.8;}
		if ($lastnucleotide=="A" || $lastnucleotide=="T"){$h+=2.3; $s+=4.1;}

        // compute new H and s based on sequence. Santalucia 1998
        for($i=0; $i<$c.length-1; $i++){
			$subc=$c.substr($i,2);
			$h+=$array_h[$subc];
			$s+=$array_s[$subc];
        }
        $tm=((1000*$h)/($s+(1.987*Math.log($conc_primer/2000000000))))-273.15;
       return  "Tm: "+$tm.toFixed(3)+" &deg;C\t" +"Enthalpy: "+$h.toFixed(3)+"\tEntropy:  "+$s.toFixed(3);
}

function Mol_wt($primer)
{
	$upper_mwt=molwt($primer,"DNA","upperlimit");
	$lower_mwt=molwt($primer,"DNA","lowerlimit");
	if ($upper_mwt==$lower_mwt)
	{
		console.log( "Molecular weight: "+$upper_mwt);
	}
	else
	{
		console.log( "Upper Molecular weight:  " + $upper_mwt +"\nLower Molecular weight:  "+$lower_mwt);
	}
}
function CountCG($c){
	$cg=substr_count($c,"G")+substr_count($c,"C");
	return $cg;
}

function CountATCG($c){
	$cg=substr_count($c,"A")+substr_count($c,"T")+substr_count($c,"G")+substr_count($c,"C");
	return $cg;
}


function Tm_min($primer){
	$primer_len=strlen($primer);
	$primer2=preg_replace("/A|T|Y|R|W|K|M|D|V|H|B|N/","A",$primer);
	$n_AT=substr_count($primer2,"A");
	$primer2=preg_replace("/C|G|S/","G",$primer);
	$n_CG=substr_count($primer2,"G");

	if ($primer_len > 0) {
			if ($primer_len < 14) {
					return round(2 * ($n_AT) + 4 * ($n_CG));
			}else{
					return round(64.9 + 41*(($n_CG-16.4)/$primer_len),1);
			}
	}
}

function Tm_max($primer){
	$primer_len=strlen($primer);
	$primer=primer_max($primer);
	$n_AT=substr_count($primer,"A");
	$n_CG=substr_count($primer,"G");
	if ($primer_len > 0) {
			if ($primer_len < 14) {
					return round(2 * ($n_AT) + 4 * ($n_CG));
			}else{
					return round(64.9 + 41*(($n_CG-16.4)/$primer_len),1);
			}
	}
}

function primer_min($primer){
        $primer=preg_replace("/A|T|Y|R|W|K|M|D|V|H|B|N/","A",$primer);
        $primer=preg_replace("/C|G|S/","G",$primer);
        return $primer;
        }

function primer_max($primer){
        $primer=preg_replace("/A|T|W/","A",$primer);
        $primer=preg_replace("/C|G|Y|R|S|K|M|D|V|H|B|N/","G",$primer);
        return $primer;
        }
function molwt($sequence,$moltype,$limit)
    {

        // the following are single strand molecular weights / base
        $rna_A_wt = 329.245;
        $rna_C_wt = 305.215;
        $rna_G_wt = 345.245;
        $rna_U_wt = 306.195;

        $dna_A_wt = 313.245;
        $dna_C_wt = 289.215;
        $dna_G_wt = 329.245;
        $dna_T_wt = 304.225;

        $water = 18.015;

        $dna_wts = {'A' : [$dna_A_wt, $dna_A_wt],  // Adenine
                         'C' : [$dna_C_wt, $dna_C_wt],  // Cytosine
                         'G' : [$dna_G_wt, $dna_G_wt],  // Guanine
                         'T' : [$dna_T_wt, $dna_T_wt],  // Thymine
                         'M' : [$dna_C_wt, $dna_A_wt],  // A or C
                         'R' : [$dna_A_wt, $dna_G_wt],  // A or G
                         'W' : [$dna_T_wt, $dna_A_wt],  // A or T
                         'S' : [$dna_C_wt, $dna_G_wt],  // C or G
                         'Y' : [$dna_C_wt, $dna_T_wt],  // C or T
                         'K' : [$dna_T_wt, $dna_G_wt],  // G or T
                         'V' : [$dna_C_wt, $dna_G_wt],  // A or C or G
                         'H' : [$dna_C_wt, $dna_A_wt],  // A or C or T
                         'D' : [$dna_T_wt, $dna_G_wt],  // A or G or T
                         'B' : [$dna_C_wt, $dna_G_wt],  // C or G or T
                         'X' : [$dna_C_wt, $dna_G_wt],  // G, A, T or C
                         'N' : [$dna_C_wt, $dna_G_wt]   // G, A, T or C
           };

        $rna_wts = {'A' : [$rna_A_wt, $rna_A_wt],  // Adenine
                         'C' : [$rna_C_wt, $rna_C_wt],  // Cytosine
                         'G' : [$rna_G_wt, $rna_G_wt],  // Guanine
                         'U' : [$rna_U_wt, $rna_U_wt],  // Uracil
                         'M' : [$rna_C_wt, $rna_A_wt],  // A or C
                         'R' : [$rna_A_wt, $rna_G_wt],  // A or G
                         'W' : [$rna_U_wt, $rna_A_wt],  // A or U
                         'S' : [$rna_C_wt, $rna_G_wt],  // C or G
                         'Y' : [$rna_C_wt, $rna_U_wt],  // C or U
                         'K' : [$rna_U_wt, $rna_G_wt],  // G or U
                         'V' : [$rna_C_wt, $rna_G_wt],  // A or C or G
                         'H' : [$rna_C_wt, $rna_A_wt],  // A or C or U
                         'D' : [$rna_U_wt, $rna_G_wt],  // A or G or U
                         'B' : [$rna_C_wt, $rna_G_wt],  // C or G or U
                         'X' : [$rna_C_wt, $rna_G_wt],  // G, A, U or C
                         'N' : [$rna_C_wt, $rna_G_wt]   // G, A, U or C
             };

        $all_na_wts = {'DNA' : $dna_wts, 'RNA' : $rna_wts};
        //print_r($all_na_wts);
        $na_wts = $all_na_wts[$moltype];

        $mwt = 0;
        $NA_len = strlen($sequence);

        if($limit=="lowerlimit"){$wlimit=1;}
        if($limit=="upperlimit"){$wlimit=0;}

        for ($i = 0; $i < $NA_len; $i++) {
            $NA_base = substr($sequence, $i, 1);
            $mwt += $na_wts[$NA_base][$wlimit];
        }
        $mwt += $water;

        return $mwt;
    }
	
	
	
exports.tm_Basic = tm_Basic;
exports.tm_Salt_Adjusted = tm_Salt_Adjusted;
exports.tm_Base_Stacking = tm_Base_Stacking;
