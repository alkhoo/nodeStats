(function () {
/*
* nodeStats.js - a statistics package for browser and node.js
* created by: Github @alkhoo - 3 Aug 2014 (one lazy Sunday afternoon)
* github: http://github.com/alkhoo/nodeStats
* Coded mostly in hospital parking lot, while waiting for my mom's chemo treament.
* http://easycalculation.com/statistics/probability-and-distributions.php
*
* Update: My mom succumbed to cancer in mid-Aug 2015. 
*/

	/** nStats Loader  **/
	/********************/
	
    var nStats = {};

    if (typeof module !== 'undefined') {
        // node.js: assign to module
		// use: var nStats = require("nStats"); 
		//      nStats.min([1,2,3,4]);
        module.exports = nStats;
    } else {
        // Browser: assign `nStats` to the window object,
		// use: nStats.min([1,2,3,4]);
        this.nStats = nStats;
    }
	
	/** Helper functions **/
	/**********************/
	nStats.version = '0.1.0';
	
	/* isNumber() - validates that n is a number */
	nStats.isNumber = function(n) {
		return !isNaN(n);
	}

	//http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
	nStats.flatten = function(array, r){
		if(!r){ r = []}
		for(var i=0; i<array.length; i++){
			if(array[i].constructor == Array){
				flatten(array[i], r);
			}else{
				r.push(array[i]);
			}
		}
		return r;
	}

	
	/* validates each number in array, (n: optional) */
	nStats.filterNum = function(array,n) {
	  if (array.length === 0) return array; // skip null array
	  if (isNaN(n)) return array.filter(nStats.isNumber); // no slicing, only filter array

	  //n =  Math.min(array.length, Math.max(1,n)); // only positive n 
	  return array.slice(0,n).filter(nStats.isNumber);
	}
	
	/* multNum() - multiply each number in array (n: optional) */
	nStats.multNum = function(array,n) {
	  var t = nStats.filterNum(array,n)
	  
	  var v = 1; 
	  for (var i = 0; i < t.length; i++) { 
		if (t[i] == 0) {return 0};
		v *= t[i];;
	  }
	  return v;
	}
	
	/* [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle). */
	/* Using Durstenfeld shuffle algorithm, may NOT be numbers hence no filterNum() */
	/* Use Array.prototype to allow chaining */
	Array.prototype.shuffle = function() {
	  for (var i = this.length - 1; i > 0; i--) {
	    var j = Math.floor(Math.random() * (i + 1));
	    var temp = this[i];
	    this[i] = this[j];
	    this[j] = temp;
	  }
	  return this;
	}

    /* http://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-an-array-based-on-suppl */
    /* Adapted for nStats */
	Array.range = function(start, end, step){
		if (start == undefined) { return [] } // "undefined" check

	    if ( (step === 0) )  { 	return []; // vs. throw TypeError("Invalid 'step' input")
	    }  // "step" == 0  check

	    if (typeof start == 'number') { // number check
			if (typeof end == 'undefined') { // single input range
				end = start;
				start = 0;
				step = 1;
			}
		    if ((!step) || (typeof step != 'number')) {
		      step = end < start ? -1 : 1;
		    }

		    var length = Math.max(Math.ceil((end - start) / step), 0);
		    var out = Array(length);

		    for (var idx = 0; idx < length; idx++, start += step) {
		      out[idx] = start;
		    }

		    // Uncomment to check "end" in range() output
		    if ( (out[out.length-1] + step) == end ) { // "end" check
		    	out.push(end)
		    }

	    } else { 
	    	// Historical: '&' is the 27th letter: http://nowiknow.com/and-the-27th-letter-of-the-alphabet/
	    	// Axiom: 'a' < 'z' and 'z' < 'A'
	    	// note: 'a' > 'A' == true ("small a > big A", try explaining it to a kid! )

	        var st = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ&'; // sorted string

	        if (typeof end == 'undefined') {
	        	end = start;
	        	start = 'a';
	        }

	        var first = st.indexOf(start);
	        var last = st.indexOf(end);

		    if ((!step) || (typeof step != 'number')) {
		      step = last < first ? -1 : 1;
		    }

	        if ((first == -1) || (last == -1 )) { // check 'first' & 'last'
	        	return []
	        }

		    var length = Math.max(Math.ceil((last - first) / step), 0);
		    var out = Array(length);

		    for (var idx = 0; idx < length; idx++, first += step) {
		      out[idx] = st[first];
		    } 

		    // Uncomment to check "end" in range() output'
		    if ( (st.indexOf(out[out.length-1]) + step ) == last ) { // "end" check
		    	out.push(end)
		    }
	    }
	    return out;
	}

	
	// Modified Kahan Sum - https://github.com/JuliaLang/julia/issues/199
	// Ported to Javascript - Aug 2016 @ Alvin Khoo
	// - test: bettersum([1,-1e100,1,1e100]) ==> 2
	// - assume input is array of numbers
	// See also:  pairwise summation to reduce rounding error - https://en.wikipedia.org/wiki/Pairwise_summation
	// Note: Kahan sum is computationally larger vs pairwise summation

	function bettersum(x) {
		n = x.length;
		if (n == 0) { return 0; } // empty array, return 0

		s = x[0];
		c = 0;
		for (var i = 1; i < n; i++) {
			t = s + x[i];
			if ( Math.abs(s) >= Math.abs(x[i]) ) {
			   c += (s-t) + x[i] ;
			} else {
			   c += (x[i]-t) + s ;
			}
			s = t
		}
		return s+c;
	}
	
	
	/* Main function */
	/*****************/
	
	/* Min() - find the minimun number in x[] (optional: process only first n records) */
	nStats.min = function(array, n) 
	{	  
	  var t = nStats.filterNum(array,n);
	  
	  if (t == null) {
		return null;
	  } else {
		return Math.min.apply(Math, t);
	  }
	}

	
	/* Max() - find the maximum number in x[] (optional: process only first n numbers) */
	nStats.max = function(array, n) 
	{
	  var t = nStats.filterNum(array,n);
	  
	  if (t == null) {
		return null;
	  } else {
		return Math.max.apply(Math, t);
	  }
	}

	
	/* Sum() - sum the numbers in x[] (optional: sum only the first n numbers) */
	nStats.sum = function(array, n) 
	{
	  var t = nStats.filterNum(array,n);
	  
	  return bettersum(t);
	}
	
	
	/* Mean() - https://en.wikipedia.org/wiki/Arithmetic_mean */
	nStats.mean = function(array, n) 
	{
	  var t = nStats.filterNum(array,n);
	  
	  if (t == null) {
		return null;
	  } else {
	    if (t.length == 1) { return t[0] }; // catch the single number
		
		return nStats.sum(t)/t.length; // note: invalid numbers are NOT counted.
	  }
	}
	
	/* Median() - Middle number of x[] (optional: median only the first n numbers) */
	nStats.median = function(array,n)
	{
	  var t = nStats.filterNum(array,n);
	  
	  if (t == null) {
		return null;
	  } else {
		if (t.length == 1) { return t[0] }; // catch the single number
		
		t = t.sort(function (a, b) { return a - b; }); //sort
		
		if (t.length % 2 == 0) { // even list, average of two numbers
			return ( (t[(t.length / 2) - 1] + t[(t.length / 2)]) / 2)
		} else { // odd list, take middle number
			return t[(t.length - 1) / 2];
		}
			
	  }
	}

	/* Mode() - find # with max of occurance in x[] (optional: mode only the first n numbers) */
	nStats.mode = function(array,n)
	{
	  var t = nStats.filterNum(array,n);
	  if (t == null) {
		return null;
	  } else {
	    if (t.length == 1) { return t[0] }; // catch the single number
		
	    t = t.sort(function (a, b) { return a - b; }); //sort
		var max_num = 0; // max # of occurance
		var max_value = ""; // the last registered max number
		var prev_num = t[0]; // the first number of t;
		var cnt = 1; //  counter
		for (var i = 1; i < t.length; i++) { // look through each number, starting at t[1]
			if (t[i] == prev_num) { // same number, increase counter 
				cnt++;
			} else { // different, check if cnt > max_num
				if (cnt >= max_num) { // counter is same or larger than max_number
					max_num = cnt;
					max_value = prev_num;
				}
				prev_num = t[i]; // update number to current number
				cnt = 1; // reset counter	
			}
		}
		return max_value;
	  }
	}
	
	/* variance() - measures how far each number is from mean() (n: optional) */
	nStats.variance = function(array,n)
	{
	  var t = nStats.filterNum(array,n);
	  if (t == null) {
		return null;
	  } else {
		var avg = nStats.mean(t);
		var v = 0; // \sigma (t[i] - mean(t))^2
		for (var i = 0; i < t.length; i++) { 
			v += Math.pow( (t[i] - avg), 2 );
		}
	  }
	  return v/t.length;
	}

	/* standard_deviation() - Population SD (n: optional) */
	nStats.standard_deviation = function(array,n) {
		var v = nStats.variance(array,n);
		if (v == null ) { return null}
		return Math.sqrt(v);
	}
	
	/* sample_variance() - Sample variance of population (n: optional) */
	nStats.sample_variance = function(array,n)
	{
	  var t = nStats.filterNum(array,n);
	  if (t == null) {
		return null;
	  } else {
		var avg = nStats.mean(t);
		var v = 0; // \sigma (t[i] - mean(t))^2
		for (var i = 0; i < t.length; i++) { 
			v += Math.pow( (t[i] - avg), 2 );
		}
	  }
	  return v/(t.length-1);
	}

	/* sample_standard_deviation() - Sample SD of population (n: optional) */
	nStats.sample_standard_deviation = function(array,n) {
		var v = nStats.sample_variance(array,n);
		if (v == null ) { return null}
		return Math.sqrt(v);
	}
	
	/* sample_covariance() - covariance of two samples (n: optional) */
	nStats.sample_covariance = function(array,array2,n) {
		var t = nStats.filterNum(array,n);
		var u = nStats.filterNum(array2,n);
		if ((t == null) || (u == null) ) { return null };
		if ((t.length <= 1) && (t.length != u.length)) { return null };
		
		var t_mean = nStats.mean(t);
		var u_mean = nStats.mean(u);
		var v = 0;
		for (var i = 0; i < t.length; i++){
            v += (t[i] - t_mean) * (u[i] - u_mean);
        }
		return v/(t.length - 1)
	}
	
	/* t-test single sample */
	/* see: http://www.statisticssolutions.com/manova-analysis-one-sample-t-test/  */
	/* Null hypothesis, Ho: u = Uo - for single sample t-test */
	nStats.t_test1sample = function(array, Uo, n) // t =(s_mean - Uo)/ (s_dev)*sqrt(n)
	{
	  var t = nStats.filterNum(array,n); 
	  if (t == null) {
		return null;
	  } else {
	   var t_mean = nStats.mean(t);
	   var t_dev = nStats.standard_deviation(t);
	   var std_err =  (t_dev) * Math.sqrt(t.length) ;
	   return { 't': (t_mean - parseFloat(Uo)) / std_err , 'dof': t.length, 'std_err': std_err };
	  }
	}

	/* t-test 2 sample, unpooled  */
	/* see: http://www.chem.utoronto.ca/coursenotes/analsci/stats/ttest.html  */
	/* https://onlinecourses.science.psu.edu/stat200/node/60 */
	nStats.t_test2sample = function(x_arr, y_arr, n) 
		//* t   = (x_mean - y_mean) / sqrt(x_sd^2/n_x+ y_sd^2/n_y)
		// dof = (x_sd^2/n_x+ y_sd^2/n_y)^2 / ( x_sd^4/(n_x^2*(n_x-1)) + y_sd^4/(n_y^2*(n_y-1)) )
	{
	  x_arr = nStats.filterNum(x_arr); // check numbers
	  y_arr = nStats.filterNum(y_arr); // check numbers
	  var x_sv = nStats.sample_variance(x_arr, n);
	  var y_sv = nStats.sample_variance(y_arr, n);
	  var x_mean = nStats.mean(x_arr,n);
	  var y_mean = nStats.mean(y_arr,n);
	  var n_x = x_arr.length;
	  var n_y = y_arr.length;

	  var std_err = Math.sqrt((x_sv/n_x) + (y_sv/n_y));
	  var s2p = ( (n_x/(n_x + n_y) * x_sv) + (n_y/(n_x + n_y)*y_sv) );
	  var t = (x_mean - y_mean) / Math.sqrt((s2p/n_x) + (s2p/n_y))
	  var dof = Math.pow((x_sv/n_x) + (y_sv/n_y), 2) / ( Math.pow(x_sv/n_x,2)/(n_x-1) + Math.pow(y_sv/n_y,2)/(n_y-1)) 
	  
	  return { 't': t, 'dof': Math.round(dof), 'std_err': std_err } 

	}


	nStats.mad = function(array,n) {
	  var t = nStats.filterNum(array,n);
	  if (t == null) {
		return null;
	  } else {
		var med = nStats.median(t);
		var v = []
		for (var i = 0; i < t.length; i++) { 
			v.push(Math.pow( (t[i] - med), 2 ));
		}
		return nStats.median(v);
	  }
	}
	
	/* https://en.wikipedia.org/wiki/Geometric_mean */
	nStats.geometric_mean = function(array,n) {
	  var t = nStats.filterNum(array,n);
	  if (t == null) {
		return null;
	  } else {
		var v = 1;
		if (nStats.min(t) <= 0) { return null }; // cant have negative
		
		for (var i = 0; i < t.length; i++) { 
			v *= t[i];
		}
	  }
	  return Math.pow(v, 1/t.length);
	}
	
	/* https://en.wikipedia.org/wiki/Harmonic_mean */
	nStats.harmonic_mean = function(array,n) {
	  var t = nStats.filterNum(array,n);
	  if (t == null) {
		return null;
	  } else {
		var v = 0;
		if (nStats.min(t) <= 0) { return null }; // cant have negative
		
		if (t.length == 2) { // harmonic mean of 2 numbers
			return (2*t[0]*t[1])/(t[0]+t[1]);
		}
		
		for (var i = 0; i < t.length; i++) { 
			v += 1/t[i];
		}
	  }
	  return t.length/v;
	}	
	
})(this);