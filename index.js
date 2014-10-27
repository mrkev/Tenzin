/* global require, console, module */
'use strict';	

var Promise = require('es6-promise').Promise;
var remap   = require('obender').remap;

var jquery = require('fs').readFileSync(__dirname + '/vendor/jquery.min.js', 'utf-8');
var t2json = require('fs').readFileSync(__dirname + '/vendor/jquery.tabletojson.js', 'utf-8');

/**
 * Tenzin, v0.0.0
 * 
 * Exports for the module.
 * @return {AcademicCalSource}
 */
module.exports = (function () {

	function AcademicCalSource(url) {
		var self = this;
		self.url = url;
		self.data = null;
	}

	// http://www.cornell.edu/academics/calendar/2014-15.cfm
	AcademicCalSource.prototype.query = function(ayear) {
		var self  = this;
		var url   = self.url + ayear + '-' + (++ayear % 2000) + '.cfm';

		var jsdom = require('jsdom');

		return new Promise(function (resolve, reject) {

			jsdom.env({
				url : url,
				src : [jquery, t2json],
			    done: 
			    function (err, window) {
			    	var $ = window.jQuery;

			    	if (err !== null) {
			    		console.error(err);
			    		reject(err);
			    	}
			    	
			    	self.data = [];

			    	$('table').each(function() {
			    		var tmp = $(this).tableToJSON();
			    		var term_title = $(this).find('caption').text();

			    		for (var i = tmp.length - 1; i >= 0; i--) {
			    			remap(
			    				{ 'Event'             : {'description'
			    															: function (val) { return val.replace('¹²³⁴⁵⁶⁷⁸⁹⁰', '') }},
			    				  'Day(s) of the Week': {'days_of_week'
			    															: function (val) { return val.replace('¹²³⁴⁵⁶⁷⁸⁹⁰', '') }},
			    				  'date'              : {'date'
			    				  				    				: function (val) { return val.replace('¹²³⁴⁵⁶⁷⁸⁹⁰', '') }},
 									}, tmp[i]);
			    		}

			    		var obj = {
			    			term : term_title.trim(),
			    			events : tmp
			    		};

			    		self.data.push(obj);
			    	});

			    	resolve(self.data);
			  	}
			});
		});
	};


	AcademicCalSource.prototype.clear = function() { this.data = null; };

	AcademicCalSource.prototype.getJSON = function(academic_year) {
		return this.query(academic_year);
	};

	return new AcademicCalSource('http://www.cornell.edu/academics/calendar/');
})();

